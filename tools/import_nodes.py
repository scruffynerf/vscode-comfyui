#!/usr/bin/env python3
"""
ComfyUI Node Importer — populates tools/node-data.json from node source trees.

Scans Python files in one or more directories for ComfyUI node class definitions
(classes that define INPUT_TYPES and RETURN_TYPES), then:

  • Adds entries to nodeDescriptions (node_type → human-readable description)
  • Adds entries to simpleExtractors where widget values are worth surfacing

Widget values are the positional values stored in workflow JSON. Only inputs with
non-pipeline types (i.e., not in MAIN_TYPES) become widget slots; pipeline-typed
inputs become wires and don't consume a positional slot.

Usage:
    python tools/import_nodes.py /path/to/custom_nodes/some_pack/
    python tools/import_nodes.py /path/to/ComfyUI/comfy_extras/ --dry-run
    python tools/import_nodes.py /path/to/nodes1/ /path/to/nodes2/ --overwrite-descriptions

Options:
    --dry-run               Print what would change without writing anything
    --overwrite-descriptions Re-import descriptions for node types already in the file
                             (by default, existing descriptions are left alone)
    --no-extractors         Skip extractor generation (only update descriptions)
"""

from __future__ import annotations

import ast
import json
import re
import sys
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Pipeline types (same set as the analyzer — widget slots only for non-pipeline inputs)
# ---------------------------------------------------------------------------

MAIN_TYPES = {
    'MODEL', 'VAE', 'CLIP', 'CLIP_VISION', 'CLIP_VISION_OUTPUT',
    'CONDITIONING', 'LATENT', 'IMAGE', 'MASK', 'VIDEO',
    'AUDIO', 'CONTROL_NET', 'STYLE_MODEL', 'GLIGEN',
    'UPSCALE_MODEL', 'SAMPLER', 'SIGMAS', 'NOISE', 'GUIDER',
}

# Widget names that are unlikely to be worth surfacing in a summary
BORING_WIDGET_NAMES = {
    'seed', 'noise_seed', 'control_after_generate', 'control_after',
    'add_noise', 'return_with_leftover_noise',
    'width', 'height', 'batch_size',   # too generic on their own
}

# Widget names that ARE worth surfacing even though they're common
INTERESTING_WIDGET_NAMES = {
    'steps', 'cfg', 'sampler_name', 'scheduler', 'denoise',
    'strength', 'strength_model', 'strength_clip',
    'lora_name', 'ckpt_name', 'vae_name', 'clip_name', 'unet_name',
    'filename_prefix', 'frame_rate', 'loop_count', 'format',
    'model_type', 'tile_size', 'max_edge', 'fps',
    'expression', 'text', 'prompt',
}

NODE_DATA_PATH = Path(__file__).parent / 'node-data.json'

# ---------------------------------------------------------------------------
# AST helpers
# ---------------------------------------------------------------------------

def _ast_const(node: ast.expr) -> Any:
    """Return the Python value of a constant AST node, or None."""
    if isinstance(node, ast.Constant):
        return node.value
    return None


def _ast_list_of_strings(node: ast.expr) -> list[str] | None:
    """Return a list of strings if node is a list/tuple of string constants."""
    if isinstance(node, (ast.List, ast.Tuple)):
        parts = [_ast_const(e) for e in node.elts]
        if all(isinstance(p, str) for p in parts):
            return parts  # type: ignore[return-value]
    return None


def _extract_return_types(cls: ast.ClassDef) -> list[str]:
    """
    Find RETURN_TYPES = (...) at class body level and return the tuple as a list.
    """
    for stmt in cls.body:
        if isinstance(stmt, ast.Assign):
            for target in stmt.targets:
                if isinstance(target, ast.Name) and target.id == 'RETURN_TYPES':
                    result = _ast_list_of_strings(stmt.value)
                    if result is not None:
                        return result
    return []


def _extract_description(cls: ast.ClassDef, source_lines: list[str]) -> str | None:
    """
    Try several sources for a human-readable node description, in priority order:
    1. DESCRIPTION = "..." class attribute
    2. CATEGORY = "..." (can hint at purpose)
    3. Docstring of the class
    4. Inferred from the class name
    """
    description: str | None = None
    for stmt in cls.body:
        if isinstance(stmt, ast.Assign):
            for target in stmt.targets:
                if isinstance(target, ast.Name) and target.id == 'DESCRIPTION':
                    val = _ast_const(stmt.value)
                    if isinstance(val, str) and val.strip():
                        return val.strip().split('\n')[0][:120]
        if isinstance(stmt, ast.Expr) and description is None:
            val = _ast_const(stmt.value)  # type: ignore[arg-type]
            if isinstance(val, str) and val.strip():
                description = val.strip().split('\n')[0][:120]
    return description


def _infer_description_from_name(class_name: str) -> str:
    """
    Convert a CamelCase class name to a lower-case description by splitting on
    word boundaries and stripping common noise suffixes.
    """
    words = re.sub(r'([a-z])([A-Z])', r'\1 \2', class_name)
    words = re.sub(r'([A-Z]+)([A-Z][a-z])', r'\1 \2', words)
    words = re.sub(r'[_+|]', ' ', words).strip()
    for suffix in ['Node', 'Loader', 'Simple', 'Advanced']:
        words = re.sub(rf'\s*{suffix}\s*$', '', words, flags=re.IGNORECASE)
    return words.lower() or class_name


def _extract_node_type(cls: ast.ClassDef) -> str | None:
    """
    Return the value of NODE_CLASS_MAPPINGS key if it maps to this class,
    or fall back to the class name. Returns None if class is not a ComfyUI node.
    """
    # We detect ComfyUI nodes by the presence of INPUT_TYPES classmethod
    for stmt in cls.body:
        if isinstance(stmt, ast.FunctionDef) and stmt.name == 'INPUT_TYPES':
            return None  # will be resolved at module level
    return None


def _is_comfyui_node(cls: ast.ClassDef) -> bool:
    """A class is a ComfyUI node if it has both INPUT_TYPES and RETURN_TYPES."""
    has_input_types = any(
        isinstance(stmt, (ast.FunctionDef, ast.AsyncFunctionDef)) and stmt.name == 'INPUT_TYPES'
        for stmt in cls.body
    )
    has_return_types = any(
        isinstance(stmt, ast.Assign) and
        any(isinstance(t, ast.Name) and t.id == 'RETURN_TYPES' for t in stmt.targets)
        for stmt in cls.body
    )
    return has_input_types and has_return_types


# ---------------------------------------------------------------------------
# Widget slot analysis
# ---------------------------------------------------------------------------

def _parse_input_types(cls: ast.ClassDef) -> list[tuple[str, str]] | None:
    """
    Parse INPUT_TYPES() return value and return a list of (name, type_str) for
    all inputs, in definition order. Returns None if the method is too complex
    to parse statically.
    """
    for stmt in cls.body:
        if not (isinstance(stmt, (ast.FunctionDef, ast.AsyncFunctionDef))
                and stmt.name == 'INPUT_TYPES'):
            continue

        # Find `return {...}` at the top level of the function body
        ret = None
        for s in stmt.body:
            if isinstance(s, ast.Return) and isinstance(s.value, ast.Dict):
                ret = s.value
                break
        if ret is None:
            return None

        # Pull out keys "required" and "optional"
        inputs: list[tuple[str, str]] = []
        for key_node, val_node in zip(ret.keys, ret.values):
            section = _ast_const(key_node)  # type: ignore[arg-type]
            if section not in ('required', 'optional'):
                continue
            if not isinstance(val_node, ast.Dict):
                continue
            for inp_key, inp_val in zip(val_node.keys, val_node.values):
                name = _ast_const(inp_key)  # type: ignore[arg-type]
                if not isinstance(name, str):
                    continue
                # inp_val is (TYPE, {...config}) — a tuple/list
                if isinstance(inp_val, (ast.Tuple, ast.List)) and inp_val.elts:
                    type_node = inp_val.elts[0]
                    # type may be a string constant or a list/tuple of strings (enum)
                    type_str = _ast_const(type_node)
                    if isinstance(type_str, str):
                        inputs.append((name, type_str))
                    else:
                        # It's an enum list — treat as STRING widget
                        inputs.append((name, 'STRING'))
        return inputs

    return None


def _widget_slots(inputs: list[tuple[str, str]]) -> list[tuple[int, str, str]]:
    """
    Given (name, type) pairs in INPUT_TYPES order, return only the widget slots:
    (slot_index, name, type) for each non-pipeline-typed input.
    Pipeline-typed inputs (MODEL, LATENT, etc.) become wires, not widget slots.
    """
    slots = []
    for name, typ in inputs:
        if typ.upper() not in MAIN_TYPES:
            slots.append((len(slots), name, typ))
    return slots


def _is_interesting_slot(name: str, typ: str) -> bool:
    """Decide if a widget slot is worth surfacing in a summary."""
    n = name.lower()
    if n in BORING_WIDGET_NAMES:
        return False
    if n in INTERESTING_WIDGET_NAMES:
        return True
    # File-like inputs are always interesting (what's loaded matters)
    if typ.upper() in ('STRING',) and any(k in n for k in ('name', 'path', 'file', 'prefix')):
        return True
    return False


def _build_extractor_rule(
    node_type: str,
    slots: list[tuple[int, str, str]],
) -> dict[str, Any] | None:
    """
    Build a simpleExtractor rule dict for the given node type and widget slots.
    Returns None if no interesting slots are found.
    """
    normalized = re.sub(r'[^a-z0-9]', '', node_type.lower())
    interesting = [(idx, name, typ) for idx, name, typ in slots if _is_interesting_slot(name, typ)]
    if not interesting:
        return None

    min_len = max(idx for idx, _, _ in interesting) + 1
    fields = []
    for idx, name, typ in interesting:
        f: dict[str, Any] = {'label': name, 'idx': idx}
        t_upper = typ.upper()
        if t_upper in ('STRING', 'COMBO'):
            f['quote'] = True
        fields.append(f)

    return {
        '_comment': f'auto-imported: {node_type}',
        'matches': [normalized],
        'exact': True,
        'minLen': min_len,
        'fields': fields,
    }


# ---------------------------------------------------------------------------
# File scanner
# ---------------------------------------------------------------------------

def _scan_file(
    path: Path,
) -> list[tuple[str, str | None, list[tuple[int, str, str]] | None]]:
    """
    Parse a Python file and return a list of
      (node_class_name, description_or_None, widget_slots_or_None)
    for each detected ComfyUI node class.
    """
    try:
        source = path.read_text(encoding='utf-8', errors='replace')
        tree = ast.parse(source)
    except SyntaxError:
        return []

    # Build NODE_CLASS_MAPPINGS if present at module level: class_name → node_type
    class_to_type: dict[str, str] = {}
    for stmt in ast.walk(tree):
        if not isinstance(stmt, ast.Assign):
            continue
        for target in stmt.targets:
            if not (isinstance(target, ast.Name) and target.id == 'NODE_CLASS_MAPPINGS'):
                continue
            if not isinstance(stmt.value, ast.Dict):
                continue
            for k, v in zip(stmt.value.keys, stmt.value.values):
                node_type = _ast_const(k)  # type: ignore[arg-type]
                class_name = None
                if isinstance(v, ast.Name):
                    class_name = v.id
                elif isinstance(v, ast.Attribute):
                    class_name = v.attr
                if isinstance(node_type, str) and class_name:
                    class_to_type[class_name] = node_type

    results = []
    source_lines = source.splitlines()
    for stmt in ast.walk(tree):
        if not isinstance(stmt, ast.ClassDef):
            continue
        if not _is_comfyui_node(stmt):
            continue
        node_type = class_to_type.get(stmt.name, stmt.name)
        desc = _extract_description(stmt, source_lines)
        inputs = _parse_input_types(stmt)
        slots = _widget_slots(inputs) if inputs is not None else None
        results.append((node_type, desc, slots))

    return results


def scan_directory(root: Path) -> list[tuple[str, str | None, list[tuple[int, str, str]] | None]]:
    """Recursively scan all .py files under root for ComfyUI node classes."""
    all_results = []
    for py_file in sorted(root.rglob('*.py')):
        # Skip tests and utility files unlikely to contain node definitions
        if any(part.startswith('test') or part == '__pycache__' for part in py_file.parts):
            continue
        all_results.extend(_scan_file(py_file))
    return all_results


# ---------------------------------------------------------------------------
# Main merge logic
# ---------------------------------------------------------------------------

def normalize_type(node_type: str) -> str:
    return re.sub(r'[^a-z0-9]', '', node_type.lower())


def merge_into_node_data(
    scan_results: list[tuple[str, str | None, list[tuple[int, str, str]] | None]],
    node_data: dict[str, Any],
    overwrite_descriptions: bool = False,
    no_extractors: bool = False,
) -> tuple[int, int, int, int]:
    """
    Merge scan results into node_data in-place.
    Returns (new_descriptions, skipped_descriptions, new_extractors, skipped_extractors).
    """
    desc_map: dict[str, str] = node_data.setdefault('nodeDescriptions', {})
    extractor_list: list[dict[str, Any]] = node_data.setdefault('simpleExtractors', [])

    # Build a set of normalized types already covered by extractors
    covered_extractors: set[str] = set()
    for rule in extractor_list:
        if rule.get('exact'):
            for m in rule['matches']:
                covered_extractors.add(m)

    new_desc = skipped_desc = new_ext = skipped_ext = 0

    for node_type, desc, slots in scan_results:
        normalized = normalize_type(node_type)

        # Descriptions
        if normalized not in desc_map or overwrite_descriptions:
            effective_desc = desc or _infer_description_from_name(node_type)
            if effective_desc:
                desc_map[normalized] = effective_desc
                new_desc += 1
        else:
            skipped_desc += 1

        # Extractors
        if no_extractors or slots is None:
            continue
        if normalized in covered_extractors:
            skipped_ext += 1
            continue
        rule = _build_extractor_rule(node_type, slots)
        if rule:
            extractor_list.append(rule)
            covered_extractors.add(normalized)
            new_ext += 1

    return new_desc, skipped_desc, new_ext, skipped_ext


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    import argparse
    parser = argparse.ArgumentParser(
        description='Import ComfyUI node definitions into tools/node-data.json'
    )
    parser.add_argument('paths', nargs='+', help='Directory or .py file(s) to scan')
    parser.add_argument('--dry-run', action='store_true',
                        help='Print changes without writing to node-data.json')
    parser.add_argument('--overwrite-descriptions', action='store_true',
                        help='Re-import descriptions for nodes already in the file')
    parser.add_argument('--no-extractors', action='store_true',
                        help='Skip extractor generation; only update descriptions')
    args = parser.parse_args()

    # Load current node-data.json
    with open(NODE_DATA_PATH) as f:
        node_data: dict[str, Any] = json.load(f)

    # Scan all given paths
    all_results: list[tuple[str, str | None, list[tuple[int, str, str]] | None]] = []
    for raw_path in args.paths:
        p = Path(raw_path)
        if p.is_dir():
            found = scan_directory(p)
            print(f'Scanned {p}: found {len(found)} node class(es)', file=sys.stderr)
            all_results.extend(found)
        elif p.is_file() and p.suffix == '.py':
            found = _scan_file(p)
            print(f'Scanned {p}: found {len(found)} node class(es)', file=sys.stderr)
            all_results.extend(found)
        else:
            print(f'Warning: skipping {p} (not a .py file or directory)', file=sys.stderr)

    if not all_results:
        print('No nodes found. Nothing to do.', file=sys.stderr)
        sys.exit(0)

    if args.dry_run:
        # Run merge on a copy so we can diff it
        import copy
        preview = copy.deepcopy(node_data)
        new_d, skip_d, new_e, skip_e = merge_into_node_data(
            all_results, preview,
            overwrite_descriptions=args.overwrite_descriptions,
            no_extractors=args.no_extractors,
        )
        print(f'DRY RUN: would add {new_d} descriptions (skip {skip_d}), '
              f'{new_e} extractors (skip {skip_e})')
        # Print the additions
        orig_descs = node_data.get('nodeDescriptions', {})
        for k, v in preview.get('nodeDescriptions', {}).items():
            if k not in orig_descs:
                print(f'  + description: {k!r} → {v!r}')
        orig_ext_count = len(node_data.get('simpleExtractors', []))
        for rule in preview.get('simpleExtractors', [])[orig_ext_count:]:
            print(f'  + extractor: {rule["matches"]} → {[f["label"] for f in rule["fields"]]}')
    else:
        new_d, skip_d, new_e, skip_e = merge_into_node_data(
            all_results, node_data,
            overwrite_descriptions=args.overwrite_descriptions,
            no_extractors=args.no_extractors,
        )
        with open(NODE_DATA_PATH, 'w') as f:
            json.dump(node_data, f, indent=2)
            f.write('\n')
        print(f'Updated {NODE_DATA_PATH}: '
              f'+{new_d} descriptions (skipped {skip_d}), '
              f'+{new_e} extractors (skipped {skip_e})')


if __name__ == '__main__':
    main()
