#!/usr/bin/env python3
"""
ComfyUI Workflow Analyzer — Python port of src/workflowAnalyzer.ts
Sync version: 4

Analyzes a ComfyUI workflow graph and produces a human/AI-readable summary.

KEEP IN SYNC WITH: src/workflowAnalyzer.ts
Both files implement the same analysis and formatting logic. When adding features
or fixing bugs here, apply the equivalent change to the TypeScript port, and
increment the sync version number in both files.

Usage:
    python workflow_analyzer.py workflow.json
    python workflow_analyzer.py /path/to/workflows/          # bulk: analyze all *.json
    python workflow_analyzer.py /path/to/workflows/ --json   # machine-readable output
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------

WorkflowNode = dict[str, Any]
# Link format: [link_id, src_node, src_slot, dst_node, dst_slot, type]
WorkflowLink = list[Any]
Workflow = dict[str, Any]

# UUID pattern — used to identify subgraph-typed nodes
UUID_RE = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    re.IGNORECASE,
)


class WorkflowFormatError(ValueError):
    pass


# ---------------------------------------------------------------------------
# Format detection and normalization
# ---------------------------------------------------------------------------

def detect_format(raw: Any) -> str:
    """
    Returns one of:
      'ui'        — standard UI-format (nodes/links arrays)
      'api'       — API-format (dict keyed by string node IDs, class_type values)
      'subgraph'  — UI-format outer shell with UUID node types + definitions.subgraphs
      'unknown'   — unrecognized
    """
    if not isinstance(raw, dict):
        return 'unknown'

    if isinstance(raw.get('nodes'), list) and isinstance(raw.get('links'), list):
        # Check for subgraph format: any node whose type looks like a UUID
        nodes = raw['nodes']
        if nodes and any(
            re.fullmatch(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
                         str(n.get('type', '')), re.IGNORECASE)
            for n in nodes
        ):
            return 'subgraph'
        return 'ui'

    # API format: top-level keys are numeric strings (possibly "node:subnode" for expanded subgraphs)
    if raw and all(re.fullmatch(r'\d+(?::\d+)*', k) for k in raw):
        first = next(iter(raw.values()))
        if isinstance(first, dict) and 'class_type' in first:
            return 'api'

    return 'unknown'


def _api_key_to_int(key: str) -> int:
    """Convert an API node key (plain '9' or subgraph-expanded '75:61') to a stable int ID."""
    if ':' in key:
        # Hash the string key to a large stable int; keep it positive and < 2^31
        return abs(hash(key)) % (2 ** 31)
    return int(key)


def normalize_api_format(raw: dict[str, Any]) -> Workflow:
    """
    Convert API-format workflow to a UI-format Workflow dict the analyzer can process.

    API-format has no type information for inputs/outputs, so all types are set to '*'.
    Classification will fall back to connectivity-only (source/sink/unknown) for most nodes.
    Handles both plain numeric keys ('9') and subgraph-expanded keys ('75:61').
    """
    nodes: list[WorkflowNode] = []
    links: list[WorkflowLink] = []
    link_id = 1

    # Build a key→int_id map upfront so link references can be resolved
    id_map: dict[str, int] = {k: _api_key_to_int(k) for k in raw}

    # First pass: collect all link references to build output slot info
    # output_refs[src_node_id][src_slot] = [link_id, ...]
    output_refs: dict[int, dict[int, list[int]]] = {}
    # pending_links: list of (link_id, src_node_id, src_slot, dst_node_id, dst_slot)
    pending_links: list[tuple[int, int, int, int, int]] = []

    for node_id_str, node_data in raw.items():
        dst_node_id = id_map[node_id_str]
        dst_slot = 0
        for val in node_data.get('inputs', {}).values():
            if isinstance(val, list) and len(val) == 2 and isinstance(val[0], (int, str)):
                src_key = str(val[0])
                src_node_id = id_map.get(src_key, _api_key_to_int(src_key))
                try:
                    src_slot = int(val[1])
                except (ValueError, TypeError):
                    dst_slot += 1
                    continue
                output_refs.setdefault(src_node_id, {}).setdefault(src_slot, []).append(link_id)
                pending_links.append((link_id, src_node_id, src_slot, dst_node_id, dst_slot))
                link_id += 1
            dst_slot += 1

    # Build links array
    for lnk_id, src_id, src_slot, dst_id, dst_slot in pending_links:
        links.append([lnk_id, src_id, src_slot, dst_id, dst_slot, '*'])

    link_by_dst: dict[tuple[int, int], int] = {}
    for lnk_id, _, _, dst_id, dst_slot in pending_links:
        link_by_dst[(dst_id, dst_slot)] = lnk_id

    for node_id_str, node_data in raw.items():
        node_id = id_map[node_id_str]
        api_inputs = node_data.get('inputs', {})
        meta = node_data.get('_meta', {})

        node_inputs = []
        widget_values = []
        dst_slot = 0
        for inp_name, val in api_inputs.items():
            if isinstance(val, list) and len(val) == 2 and isinstance(val[0], (int, str)):
                lnk_id = link_by_dst.get((node_id, dst_slot))
                node_inputs.append({'name': inp_name, 'type': '*', 'link': lnk_id})
            else:
                widget_values.append(val)
            dst_slot += 1

        slots = output_refs.get(node_id, {})
        node_outputs = []
        if slots:
            for slot_idx in range(max(slots.keys()) + 1):
                node_outputs.append({
                    'name': f'output_{slot_idx}',
                    'type': '*',
                    'links': slots.get(slot_idx, []),
                })

        title = meta.get('title') if meta else None
        node: WorkflowNode = {
            'id': node_id,
            'type': node_data.get('class_type', '?'),
            'inputs': node_inputs,
            'outputs': node_outputs,
            'widgets_values': widget_values,
        }
        if title:
            node['title'] = title
        # Preserve the original string key for display when it's a subgraph ref
        if ':' in node_id_str:
            node['_api_key'] = node_id_str
        nodes.append(node)

    last_node_id = max((n['id'] for n in nodes), default=0)

    return {
        'nodes': nodes,
        'links': links,
        'last_node_id': last_node_id,
        'last_link_id': link_id - 1,
        '_source_format': 'api',
    }


def load_workflow(path: Path) -> tuple[Workflow, str]:
    """
    Load and normalize a workflow JSON file.
    Returns (workflow, format_name).
    Raises WorkflowFormatError for unrecognized formats.
    """
    with open(path) as f:
        raw = json.load(f)

    fmt = detect_format(raw)

    if fmt == 'ui':
        return raw, 'ui'

    if fmt == 'api':
        return normalize_api_format(raw), 'api'

    if fmt == 'subgraph':
        # The outer UI shell is valid — process it, but warn that UUID-typed nodes
        # are subgraph references whose internals are not expanded.
        return raw, 'subgraph'

    raise WorkflowFormatError(
        f'Unrecognized workflow format in {path.name}. '
        'Expected UI-format (nodes/links arrays) or API-format (string-keyed node dict).'
    )

# ---------------------------------------------------------------------------
# Functional operation class classifier
# ---------------------------------------------------------------------------

# KEEP IN SYNC WITH: src/nodeCatalog.ts (MAIN_TYPES) and
#                    src/workflowAnalyzer.ts (MAIN_TYPES)
# All three use the same set and the same ten OperationClass values.
MAIN_TYPES = {
    'MODEL', 'VAE', 'CLIP', 'CLIP_VISION', 'CLIP_VISION_OUTPUT',
    'CONDITIONING', 'LATENT', 'IMAGE', 'MASK', 'VIDEO',
    'AUDIO', 'CONTROL_NET', 'STYLE_MODEL', 'GLIGEN',
    'UPSCALE_MODEL', 'SAMPLER', 'SIGMAS', 'NOISE', 'GUIDER',
}

OperationClass = str  # 'source' | 'transform' | 'convert' | 'combine' | 'split' | 'sampler' | 'sink' | 'control' | 'variable' | 'misc'

CLASS_LABEL: dict[str, str] = {
    'source': 'Source', 'transform': 'Transform', 'convert': 'Convert',
    'combine': 'Combine', 'split': 'Split', 'sampler': 'Sampler',
    'sink': 'Sink', 'control': 'Control',
    'variable': 'Variable',  # outputs only primitive/non-pipeline types (INT, FLOAT, STRING, etc.)
    'misc': 'Misc',           # catch-all for edge cases the classifier can't categorize cleanly
}


def node_main_input_types(node: WorkflowNode) -> list[str]:
    return [i['type'] for i in (node.get('inputs') or []) if i.get('type') in MAIN_TYPES]


def node_main_output_types(node: WorkflowNode) -> list[str]:
    return [o['type'] for o in (node.get('outputs') or []) if o.get('type') in MAIN_TYPES]


def classify_node(node: WorkflowNode) -> OperationClass:
    in_types = node_main_input_types(node)
    out_types = node_main_output_types(node)
    in_set = set(in_types)
    out_set = set(out_types)

    # Sampler: MODEL + CONDITIONING + LATENT → LATENT
    if 'MODEL' in in_set and 'CONDITIONING' in in_set and 'LATENT' in in_set and 'LATENT' in out_set:
        return 'sampler'
    # Variable: SetNode/GetNode are variable storage/retrieval regardless of the type they carry
    if node.get('type') in ('SetNode', 'GetNode'):
        return 'variable'
    # Sink: no main-type outputs AND no connected outputs of any type.
    # Nodes that only output FLOAT/INT/STRING/etc. (not in MAIN_TYPES) are not true sinks
    # if those outputs are wired to something.
    if not out_set:
        outputs = node.get('outputs') or []
        has_any_linked_output = any(o.get('links') for o in outputs)
        if not has_any_linked_output:
            return 'sink'
        # Has connected outputs of primitive/non-main types — fall through to variable/misc
    # Control: loop/flow by name
    if re.search(r'loop|forloop|whileloop', node.get('type', ''), re.IGNORECASE):
        return 'control'
    # Source: no main-type inputs, has main-type outputs
    if not in_set:
        if out_set:
            return 'source'
        # Variable: no main-type inputs, outputs only primitive/non-main types that are wired to something
        outputs = node.get('outputs') or []
        if any(o.get('links') for o in outputs):
            return 'variable'
    # Transform: same main types in and out
    if in_set and out_set and len(out_set) == len(in_set) and out_set <= in_set:
        return 'transform'
    if out_set:
        out_type = next(iter(out_set))
        # Combine: multiple inputs of the same main type → one output of that type
        if len(out_set) == 1 and in_types.count(out_type) >= 2:
            return 'combine'
        # Split: one input main type fans out to multiple outputs of the same type
        if len(in_set) == 1 and len(out_types) > 1 and all(t in in_set for t in out_set):
            return 'split'
        return 'convert'
    return 'misc'

# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------

def get_nodes_dict(wf: Workflow) -> dict[int, WorkflowNode]:
    return {n['id']: n for n in wf.get('nodes', [])}


def get_links_dict(wf: Workflow) -> dict[int, WorkflowLink]:
    return {l[0]: l for l in wf.get('links', [])}


def build_subgraph_dict(wf: Workflow) -> dict[str, Any]:
    """Return UUID → subgraph definition dict from wf['definitions']['subgraphs']."""
    return {sg['id']: sg for sg in (wf.get('definitions') or {}).get('subgraphs', [])}


def format_node(node_id: int, nodes_dict: dict[int, WorkflowNode],
                sg_dict: dict[str, Any] | None = None) -> str:
    node = nodes_dict.get(node_id)
    if not node:
        return f'[{node_id}] ?'
    node_type = node.get('type', '?')
    if sg_dict and UUID_RE.match(node_type):
        sg = sg_dict.get(node_type)
        if sg:
            node_type = f'"{sg["name"]}"'
    title = node.get('title', '')
    title_str = f' "{title}"' if title and title != node.get('type', '?') else ''
    return f'[{node_id}] {node_type}{title_str}'

# ---------------------------------------------------------------------------
# Node descriptions + simple extractor rules — loaded from shared JSON
# Both this file and src/workflowAnalyzer.ts load tools/node-data.json so
# the library only needs to be maintained in one place.
# ---------------------------------------------------------------------------

_NODE_DATA_PATH = Path(__file__).parent / 'node-data.json'
with open(_NODE_DATA_PATH) as _f:
    _NODE_DATA: dict[str, Any] = json.load(_f)

NODE_DESCRIPTIONS: dict[str, str] = _NODE_DATA['nodeDescriptions']
EXTRACTORS: list[dict[str, Any]] = _NODE_DATA['simpleExtractors']


def get_node_description(node_type: str) -> str:
    normalized = re.sub(r'[^a-z0-9]', '', node_type.lower())
    for key, desc in NODE_DESCRIPTIONS.items():
        if key in normalized or normalized in key:
            return desc
    words = re.sub(r'([a-z])([A-Z])', r'\1 \2', node_type)
    words = re.sub(r'[_+|]', ' ', words).strip()
    for suffix in ['Node', 'Loader', 'Simple', 'Advanced', 'pysssss', 'rgthree']:
        words = re.sub(rf'\s*{suffix}\s*$', '', words, flags=re.IGNORECASE)
    return words.lower() or node_type


def _check_guard(g: dict[str, Any], vals: list[Any]) -> bool:
    idx = g['idx']
    if idx >= len(vals):
        return False
    val = vals[idx]
    if g.get('notNull') and val is None:
        return False
    if g.get('type') == 'string' and not isinstance(val, str):
        return False
    if g.get('type') == 'number' and not isinstance(val, (int, float)):
        return False
    if g.get('nonEmpty') and isinstance(val, str) and not val.strip():
        return False
    return True


def _render_field(f: dict[str, Any], val: Any) -> str:
    if f.get('stringify'):
        val = str(val)
    trunc = f.get('truncate')
    if trunc is not None and isinstance(val, str) and len(val) > trunc:
        val = val[:trunc] + '…'
    if f.get('stripNewlines') and isinstance(val, str):
        val = val.replace('\n', ' ')
    label = f['label']
    if f.get('json'):
        return f'{label}: {json.dumps(val)}'
    if f.get('quote'):
        return f'{label}: "{val}"'
    return f'{label}: {val}'


def apply_extractors(normalized_type: str, vals: list[Any]) -> str | None:
    """Apply data-driven extractor rules from tools/node-data.json."""
    for rule in EXTRACTORS:
        matches = rule['matches']
        if rule.get('exact'):
            if normalized_type not in matches:
                continue
        else:
            if not any(m in normalized_type for m in matches):
                continue
        if len(vals) < rule.get('minLen', 0):
            continue
        if not all(_check_guard(g, vals) for g in rule.get('typeGuards', [])):
            continue
        parts = [_render_field(f, vals[f['idx']]) for f in rule['fields'] if f['idx'] < len(vals)]
        if parts:
            return ', '.join(parts)
    return None

# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------

VISUAL_TYPES = {'Note', 'MarkdownNote', 'Label (rgthree)', 'PrimitiveNode'}


def is_visual_only(node: WorkflowNode) -> bool:
    return node.get('type', '') in VISUAL_TYPES or 'label' in node.get('type', '').lower()


def analyze_workflow(wf: Workflow) -> dict[str, Any]:
    nodes_dict = get_nodes_dict(wf)
    links_dict = get_links_dict(wf)
    nodes = wf.get('nodes', [])
    links = wf.get('links', [])

    # Basic counts
    type_counts: dict[str, int] = {}
    for n in nodes:
        t = n.get('type', '')
        type_counts[t] = type_counts.get(t, 0) + 1

    # Compute last IDs
    last_node_id = wf.get('last_node_id', 0)
    last_link_id = wf.get('last_link_id', 0)
    for n in nodes:
        if n['id'] > last_node_id:
            last_node_id = n['id']
    for l in links:
        if l[0] > last_link_id:
            last_link_id = l[0]

    # Workflow type — scan outer nodes and subgraph internals (up to 3 levels deep)
    _sg_dict_for_type = build_subgraph_dict(wf)

    def _collect_node_types(node_list: list[WorkflowNode], depth: int) -> str:
        types = ' '.join(n.get('type', '').lower() for n in node_list)
        if depth < 3:
            for n in node_list:
                t = n.get('type', '')
                if UUID_RE.match(t) and t in _sg_dict_for_type:
                    types += ' ' + _collect_node_types(_sg_dict_for_type[t].get('nodes', []), depth + 1)
        return types

    all_types = _collect_node_types(nodes, 0)
    workflow_type = 'Video' if ('video' in all_types or 'vhs' in all_types) else 'General'

    # Resolve SetNode/GetNode variable pairs
    set_nodes: dict[str, int] = {}   # name -> set_node_id
    get_nodes_map: dict[int, int] = {}  # get_node_id -> set_node_id

    for node in nodes:
        if node.get('type') == 'SetNode':
            name = (node.get('title') or '').replace('Set_', '', 1)
            if name:
                set_nodes[name] = node['id']
    for node in nodes:
        if node.get('type') == 'GetNode':
            name = (node.get('title') or '').replace('Get_', '', 1)
            if name and name in set_nodes:
                get_nodes_map[node['id']] = set_nodes[name]

    # Build backward adjacency (with Get/Set resolution)
    # backward: dst_id -> [(src_id, link_id, dtype)]
    backward: dict[int, list[tuple[int, int, str]]] = {}
    for link in links:
        link_id, src_id, _src_slot, dst_id, _dst_slot, dtype = link[0], link[1], link[2], link[3], link[4], link[5]
        backward.setdefault(dst_id, []).append((src_id, link_id, dtype))
    for get_id, set_id in get_nodes_map.items():
        for src_id, _, dtype in backward.get(set_id, []):
            backward.setdefault(get_id, []).append((src_id, -1, dtype))

    # Entry points: nodes with no connected inputs
    entry_points: list[int] = []
    for node in nodes:
        if is_visual_only(node):
            continue
        if node['id'] in get_nodes_map:
            continue
        inputs = node.get('inputs') or []
        if not inputs or all(inp.get('link') is None for inp in inputs):
            entry_points.append(node['id'])

    # Exit points: nodes with no connected outputs
    exit_points: list[int] = []
    for node in nodes:
        if is_visual_only(node):
            continue
        if node.get('type') == 'SetNode':
            name = (node.get('title') or '').replace('Set_', '', 1)
            has_consumers = any(
                n.get('type') == 'GetNode' and (n.get('title') or '').replace('Get_', '', 1) == name
                for n in nodes
            )
            if has_consumers:
                continue
        outputs = node.get('outputs') or []
        if not outputs or all(not (out.get('links') or []) for out in outputs):
            exit_points.append(node['id'])

    # Classify every non-visual node
    node_classes: dict[int, OperationClass] = {}
    for node in nodes:
        if not is_visual_only(node):
            node_classes[node['id']] = classify_node(node)

    # Sources: entry points classified as Source
    sources = [
        {'nodeId': nid, 'provides': node_main_output_types(nodes_dict[nid])}
        for nid in entry_points
        if node_classes.get(nid) == 'source'
    ]

    # Primary outputs: exit points classified as Sink
    primary_outputs = [nid for nid in exit_points if node_classes.get(nid) == 'sink']

    # Trace main pipeline: DFS backward from each exit, take longest path
    def trace_pipeline(exit_id: int) -> list[tuple[int, str]]:
        longest: list[tuple[int, str]] = []

        def visit(node_id: int, path: list[tuple[int, str]], dtype: str) -> None:
            nonlocal longest
            current = [(node_id, dtype)] + path
            upstream = backward.get(node_id, [])
            if not upstream:
                if len(current) > len(longest):
                    longest = current
                return
            for src_id, _, src_dtype in upstream:
                visit(src_id, current, src_dtype)

        visit(exit_id, [], '')
        return longest

    main_pipeline: list[tuple[int, str]] = []
    for exit_id in exit_points:
        path = trace_pipeline(exit_id)
        if len(path) > len(main_pipeline):
            main_pipeline = path

    # Variables
    variables = []
    for name, set_id in set_nodes.items():
        set_inputs = backward.get(set_id, [])
        source_id = set_inputs[0][0] if set_inputs else None
        source_type = nodes_dict[source_id].get('type') if source_id is not None else None

        get_ids = [gid for gid, sid in get_nodes_map.items() if sid == set_id]

        consumers = []
        for get_id in get_ids:
            for link in links:
                link_id, src_id, _src_slot, dst_id, dst_slot = link[0], link[1], link[2], link[3], link[4]
                if src_id == get_id:
                    consumer = nodes_dict.get(dst_id)
                    if consumer:
                        consumers.append({'nodeId': dst_id, 'nodeType': consumer.get('type', ''), 'inputSlot': dst_slot})
        variables.append({'name': name, 'setId': set_id, 'sourceId': source_id, 'sourceType': source_type,
                          'getIds': get_ids, 'consumers': consumers})

    # Loops
    loop_starts: dict[int, dict] = {}
    for node in nodes:
        t = node.get('type', '').lower()
        if any(k in t for k in ('loopstart', 'forstart', 'whilestart')):
            info: dict[str, Any] = {
                'name': node.get('title') or node.get('type'),
                'startId': node['id'],
                'startType': node.get('type'),
            }
            # Try to find iteration count
            for inp in (node.get('inputs') or []):
                inp_name = (inp.get('name') or '').lower()
                if any(k in inp_name for k in ('total', 'iteration', 'count')) and inp.get('link') is not None:
                    link = links_dict.get(inp['link'])
                    if link:
                        src_node = nodes_dict.get(link[1])
                        if src_node:
                            src_t = src_node.get('type', '').lower()
                            if 'constant' in src_t or 'primitive' in src_t:
                                vals = src_node.get('widgets_values')
                                first = vals[0] if isinstance(vals, list) and vals else None
                                if isinstance(first, (int, float)):
                                    info['iterations'] = round(first)
                    break
            loop_starts[node['id']] = info

    loops = []
    for node in nodes:
        t = node.get('type', '').lower()
        if any(k in t for k in ('loopend', 'forend', 'whileend')):
            for inp in (node.get('inputs') or []):
                if inp.get('link') is not None:
                    link = links_dict.get(inp['link'])
                    if link and link[1] in loop_starts:
                        info = {**loop_starts[link[1]], 'endId': node['id'], 'endType': node.get('type')}
                        loops.append(info)
                        break
    # Add loop starts without a matched end
    for info in loop_starts.values():
        if not any(l['startId'] == info['startId'] for l in loops):
            loops.append(info)

    # Sections (Label nodes)
    sections = []
    for node in nodes:
        if 'label' in node.get('type', '').lower():
            title = node.get('title')
            if not title:
                vals = node.get('widgets_values')
                title = str(vals[0]) if isinstance(vals, list) and vals else 'Unnamed'
            if title and len(title) > 2:
                sections.append({'title': title, 'nodeId': node['id']})

    return {
        'nodeCount': len(nodes),
        'linkCount': len(links),
        'lastNodeId': last_node_id,
        'lastLinkId': last_link_id,
        'workflowType': workflow_type,
        'typeCounts': type_counts,
        'nodeClasses': node_classes,
        'entryPoints': sorted(entry_points),
        'exitPoints': sorted(exit_points),
        'sources': sources,
        'primaryOutputs': primary_outputs,
        'mainPipeline': main_pipeline,
        'variables': variables,
        'loops': loops,
        'sections': sections,
    }

# ---------------------------------------------------------------------------
# Widget value extraction
# ---------------------------------------------------------------------------

def extract_node_values(node: WorkflowNode) -> str | None:
    """
    Extract the most meaningful current values from a node's widgets_values.
    All extraction rules live in tools/node-data.json — no node-specific code here.
    """
    vals = node.get('widgets_values')
    if not vals:
        return None

    if isinstance(vals, list):
        return apply_extractors(node.get('type', '').lower(), vals)
    elif isinstance(vals, dict):
        # Dict-style widget values (some custom nodes) — generic fallback, no rule needed
        entries = list(vals.items())[:5]
        if entries:
            return ', '.join(f'{k}: {json.dumps(v)}' for k, v in entries)
    return None

# ---------------------------------------------------------------------------
# Markdown formatter
# ---------------------------------------------------------------------------

def format_workflow_summary(wf: Workflow) -> str:
    r = analyze_workflow(wf)
    nodes_dict = get_nodes_dict(wf)
    sg_dict = build_subgraph_dict(wf)
    nodes = wf.get('nodes', [])
    lines: list[str] = []

    # Count nodes inside subgraphs recursively for the header
    def _count_internal(node_list: list[WorkflowNode], depth: int) -> int:
        total = 0
        if depth >= 3:
            return total
        for n in node_list:
            t = n.get('type', '')
            if UUID_RE.match(t) and t in sg_dict:
                sg = sg_dict[t]
                total += len(sg.get('nodes', [])) + _count_internal(sg.get('nodes', []), depth + 1)
        return total

    internal_count = _count_internal(nodes, 0)
    node_count_str = (
        f'{r["nodeCount"]} outer + {internal_count} in subgraphs'
        if internal_count else str(r['nodeCount'])
    )

    # Helper: description for a node type, with subgraph name fallback for UUIDs
    def describe_type(node_type: str) -> str:
        if UUID_RE.match(node_type):
            sg = sg_dict.get(node_type)
            return f'subgraph "{sg["name"]}"' if sg else 'subgraph (unknown)'
        return get_node_description(node_type)

    lines.append('# ComfyUI Workflow Summary')
    lines.append('')
    lines.append(f'**Type**: {r["workflowType"]} | **Nodes**: {node_count_str} | **Links**: {r["linkCount"]}')
    lines.append(
        f'**Next IDs** (use when adding nodes/links): '
        f'next_node_id: {r["lastNodeId"] + 1}, next_link_id: {r["lastLinkId"] + 1}'
    )

    # Main Pipeline — before Sources so the overall shape is visible first
    if len(r['mainPipeline']) >= 2:
        lines.append('')
        lines.append(f'## Main Pipeline ({len(r["mainPipeline"])} nodes)')
        MAX_SHOWN = 12
        shown = r['mainPipeline'][:MAX_SHOWN]
        parts = [
            f'{format_node(nid, nodes_dict, sg_dict)} [{CLASS_LABEL.get(r["nodeClasses"].get(nid, "misc"), "?")}]'
            for nid, _ in shown
        ]
        lines.append(' → '.join(parts))
        if len(r['mainPipeline']) > MAX_SHOWN:
            lines.append(f'_({len(r["mainPipeline"]) - MAX_SHOWN} more nodes not shown)_')

    # Sources
    if r['sources']:
        lines.append('')
        lines.append('## Sources')
        for s in r['sources']:
            node = nodes_dict.get(s['nodeId'])
            desc = describe_type(node.get('type', '') if node else '')
            provides = f' → {", ".join(s["provides"])}' if s['provides'] else ''
            lines.append(f'- {format_node(s["nodeId"], nodes_dict, sg_dict)} — {desc}{provides}')

    # Non-source entry points
    non_source_entries = [nid for nid in r['entryPoints'] if r['nodeClasses'].get(nid) != 'source']
    if non_source_entries:
        lines.append('')
        lines.append('## Other Entry Points')
        lines.append('_(nodes with no connected inputs that are not pure Sources — may be misconfigured or use widget-only inputs)_')
        for nid in non_source_entries:
            cls = CLASS_LABEL.get(r['nodeClasses'].get(nid, 'unknown'), '?')
            node = nodes_dict.get(nid)
            desc = describe_type(node.get('type', '') if node else '')
            lines.append(f'- {format_node(nid, nodes_dict, sg_dict)} [{cls}] — {desc}')

    # Primary outputs (Sinks)
    if r['primaryOutputs']:
        lines.append('')
        lines.append('## Outputs (Sinks)')
        for nid in r['primaryOutputs']:
            node = nodes_dict.get(nid)
            desc = describe_type(node.get('type', '') if node else '')
            consumes = ', '.join(node_main_input_types(node)) if node else ''
            consumes_str = f' ← {consumes}' if consumes else ''
            lines.append(f'- {format_node(nid, nodes_dict, sg_dict)} — {desc}{consumes_str}')

    # Subgraphs — expand each UUID-typed node instance to show its internals
    uuid_outer_nodes = [n for n in nodes if not is_visual_only(n) and UUID_RE.match(n.get('type', '')) and n.get('type', '') in sg_dict]
    if uuid_outer_nodes:
        lines.append('')
        lines.append('## Subgraphs')
        lines.append('_Each subgraph node contains internal nodes. Node IDs shown are the ones to use when editing the workflow JSON._')

        def render_subgraph(node: WorkflowNode, depth: int) -> None:
            sg = sg_dict.get(node.get('type', ''))
            if not sg:
                return
            heading = '###' if depth == 0 else '####'
            lines.append('')
            lines.append(f'{heading} [{node["id"]}] "{sg["name"]}"')
            sg_inputs = sg.get('inputs', [])
            if sg_inputs:
                lines.append('**Inputs**: ' + ', '.join(
                    f'{i.get("label") or i.get("name", "?")} ({i.get("type", "?")})'
                    for i in sg_inputs
                ))
            sg_outputs = sg.get('outputs', [])
            if sg_outputs:
                lines.append('**Outputs**: ' + ', '.join(
                    f'{o.get("label") or o.get("name", "?")} ({o.get("type", "?")})'
                    for o in sg_outputs
                ))
            sg_nodes = sg.get('nodes', [])
            sg_nodes_dict = get_nodes_dict({'nodes': sg_nodes, 'links': sg.get('links', [])})

            def _is_named_param(n: WorkflowNode) -> bool:
                """Titled Primitive* / constant nodes — the tunable "knobs" of the subgraph."""
                t = n.get('type', '').lower()
                if not any(k in t for k in ('primitive', 'constant')):
                    return False
                title = n.get('title', '')
                return bool(title and title != n.get('type', ''))

            # 1. Named parameters block (titled Primitive*/constant nodes)
            param_nodes = [n for n in sg_nodes
                           if not is_visual_only(n) and not UUID_RE.match(n.get('type', ''))
                           and _is_named_param(n)]
            if param_nodes:
                lines.append('**Parameters**:')
                for n in param_nodes:
                    v = extract_node_values(n)
                    # Strip the "value: " prefix for compact display
                    val_str = ''
                    if v:
                        val_str = ' = ' + (v.split(': ', 1)[1] if v.startswith('value: ') else v)
                    lines.append(f'  - **{n["title"]}**{val_str} [id:{n["id"]}]')

            # 2. All other internal nodes with extractable values
            skip_ids = {n['id'] for n in param_nodes}
            no_value_types: dict[str, int] = {}
            for n in sg_nodes:
                if is_visual_only(n) or UUID_RE.match(n.get('type', '')):
                    continue
                if n['id'] in skip_ids:
                    continue
                v = extract_node_values(n)
                if v:
                    cls = CLASS_LABEL.get(classify_node(n), '?')
                    lines.append(f'- {format_node(n["id"], sg_nodes_dict, sg_dict)} [{cls}]: {v}')
                else:
                    t = n.get('type', '?')
                    no_value_types[t] = no_value_types.get(t, 0) + 1

            # 3. Compact list of structural/passthrough nodes with no extractable values
            if no_value_types:
                parts = [f'{t}{"×"+str(c) if c > 1 else ""}' for t, c in sorted(no_value_types.items())]
                lines.append(f'_Also contains: {", ".join(parts)}_')

            # Recurse into nested subgraph instances (one more level)
            nested_uuids = [n for n in sg_nodes if not is_visual_only(n) and UUID_RE.match(n.get('type', '')) and n.get('type', '') in sg_dict]
            if depth < 1:
                for nested in nested_uuids:
                    render_subgraph(nested, depth + 1)
            elif nested_uuids:
                lines.append(f'_({len(nested_uuids)} nested subgraph(s) not expanded — see workflow JSON)_')

        for node in uuid_outer_nodes:
            render_subgraph(node, 0)

    # Variables
    if r['variables']:
        lines.append('')
        lines.append('## Variables (SetNode/GetNode)')
        for v in r['variables']:
            src_str = (f'set by {format_node(v["sourceId"], nodes_dict, sg_dict)}'
                       if v['sourceId'] is not None else f'set by [{v["setId"]}]')
            consumer_str = (f', used by {", ".join(format_node(c["nodeId"], nodes_dict, sg_dict) for c in v["consumers"])}'
                            if v['consumers'] else '')
            lines.append(f'- **"{v["name"]}"**: {src_str}{consumer_str}')

    # Loops
    if r['loops']:
        lines.append('')
        lines.append('## Loops')
        for loop in r['loops']:
            end_str = f'→ [{loop["endId"]}]' if loop.get('endId') is not None else '(no end found)'
            iter_str = f', {loop["iterations"]} iterations' if loop.get('iterations') is not None else ''
            lines.append(f'- {loop["startType"]} [{loop["startId"]}] {end_str}{iter_str}')

    # Sections
    if r['sections']:
        lines.append('')
        lines.append('## Sections (Labels)')
        for s in r['sections']:
            lines.append(f'- **"{s["title"]}"** (Label node [{s["nodeId"]}])')

    # Current node values (outer workflow only — subgraph values are in ## Subgraphs above)
    value_lines = []
    for node in nodes:
        if UUID_RE.match(node.get('type', '')):
            continue  # subgraph nodes have no extractable widget values
        v = extract_node_values(node)
        if v:
            cls = CLASS_LABEL.get(r['nodeClasses'].get(node['id'], 'misc'), '?')
            value_lines.append(f'- {format_node(node["id"], nodes_dict, sg_dict)} [{cls}]: {v}')
    if value_lines:
        lines.append('')
        lines.append('## Current Node Values')
        lines.append('')
        lines.append('_These values are already extracted — no need to read the workflow JSON to find them._')
        lines.append('')
        lines.extend(value_lines)

    # Hints for common tasks
    hint_lines = []

    prompt_nodes = [n for n in nodes if r['nodeClasses'].get(n['id']) == 'convert' and 'CONDITIONING' in node_main_output_types(n)]
    if prompt_nodes:
        hint_lines.append(f'- **Change prompt/conditioning**: {", ".join(format_node(n["id"], nodes_dict, sg_dict) for n in prompt_nodes)}')

    sampler_nodes = [n for n in nodes if r['nodeClasses'].get(n['id']) == 'sampler']
    if sampler_nodes:
        hint_lines.append(f'- **Adjust sampler settings**: {", ".join(format_node(n["id"], nodes_dict, sg_dict) for n in sampler_nodes)}')

    model_sources = [s for s in r['sources'] if 'MODEL' in s['provides']]
    if model_sources:
        hint_lines.append(f'- **Swap model**: {", ".join(format_node(s["nodeId"], nodes_dict, sg_dict) for s in model_sources)}')

    model_transforms = [n for n in nodes if r['nodeClasses'].get(n['id']) == 'transform' and 'MODEL' in node_main_input_types(n)]
    if model_transforms:
        hint_lines.append(f'- **Swap/adjust model modifiers (LoRA etc.)**: {", ".join(format_node(n["id"], nodes_dict, sg_dict) for n in model_transforms)}')

    media_sources = [s for s in r['sources'] if 'IMAGE' in s['provides'] or 'VIDEO' in s['provides']]
    if media_sources:
        hint_lines.append(f'- **Change input media**: {", ".join(format_node(s["nodeId"], nodes_dict, sg_dict) for s in media_sources)}')

    if r['primaryOutputs']:
        hint_lines.append(f'- **Change output destination/format**: {", ".join(format_node(nid, nodes_dict, sg_dict) for nid in r["primaryOutputs"])}')

    if hint_lines:
        lines.append('')
        lines.append('## Hints for Common Tasks')
        lines.append('')
        lines.append('Use node IDs below to locate the right section of the workflow JSON when making changes.')
        lines.append('')
        lines.extend(hint_lines)

    # Node type breakdown — skip UUID types (covered in ## Subgraphs)
    lines.append('')
    lines.append('## Node Type Breakdown')
    eligible = [(t, c) for t, c in r['typeCounts'].items() if t not in VISUAL_TYPES and not UUID_RE.match(t)]
    sorted_types = sorted(eligible, key=lambda x: -x[1])[:15]
    for t, count in sorted_types:
        rep = next((n for n in nodes if n.get('type') == t), None)
        cls = CLASS_LABEL.get(r['nodeClasses'].get(rep['id'], 'misc'), '?') if rep else '?'
        desc = get_node_description(t)
        lines.append(f'- `{t}` ×{count} [{cls}] — {desc}')
    hidden_count = len(eligible) - len(sorted_types)
    if hidden_count > 0:
        lines.append(f'_({hidden_count} more node types not shown)_')

    lines.append('')
    lines.append('---')
    lines.append('_Generated by workflow_analyzer.py_')

    return '\n'.join(lines)

# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def analyze_file(path: Path, as_json: bool = False) -> dict[str, Any] | str:
    wf, fmt = load_workflow(path)
    fmt_note = '' if fmt == 'ui' else f'  [format: {fmt}]'
    if as_json:
        r = analyze_workflow(wf)
        r['nodeClasses'] = {str(k): v for k, v in r['nodeClasses'].items()}
        r['_source_format'] = fmt
        return r
    summary = format_workflow_summary(wf)
    if fmt == 'api':
        header = '> **Note**: converted from API format — type-based classification unavailable\n\n'
        summary = summary.replace('# ComfyUI Workflow Summary\n', f'# ComfyUI Workflow Summary\n\n{header}', 1)
    return summary


def main() -> None:
    import argparse
    parser = argparse.ArgumentParser(description='Analyze ComfyUI workflow JSON files')
    parser.add_argument('path', help='Path to a .json file or directory of .json files')
    parser.add_argument('--json', action='store_true', help='Output machine-readable JSON instead of markdown')
    parser.add_argument('--errors-only', action='store_true', help='Only print files that raised errors (useful for bulk testing)')
    args = parser.parse_args()

    target = Path(args.path)

    if target.is_dir():
        files = sorted(target.rglob('*.json'))
        print(f'Found {len(files)} JSON files in {target}\n', file=sys.stderr)
        errors = 0
        skipped = 0
        ok = 0
        for f in files:
            try:
                result = analyze_file(f, as_json=args.json)
                ok += 1
                if not args.errors_only:
                    print(f'\n{"="*60}')
                    print(f'FILE: {f}')
                    print('='*60)
                    if args.json:
                        print(json.dumps(result, indent=2))
                    else:
                        print(result)
            except WorkflowFormatError as e:
                errors += 1
                print(f'FORMAT [{f}]: {e}', file=sys.stderr)
            except (KeyError, IndexError, TypeError, ValueError) as e:
                errors += 1
                print(f'ERROR  [{f}]: {type(e).__name__}: {e}', file=sys.stderr)
            except json.JSONDecodeError as e:
                skipped += 1
                print(f'SKIP   [{f}]: not valid JSON — {e}', file=sys.stderr)
        print(f'\nDone: {ok} ok, {errors} errors, {skipped} skipped (not JSON)', file=sys.stderr)
    elif target.is_file():
        try:
            result = analyze_file(target, as_json=args.json)
            if args.json:
                print(json.dumps(result, indent=2))
            else:
                print(result)
        except Exception as e:
            print(f'Error: {e}', file=sys.stderr)
            sys.exit(1)
    else:
        print(f'Path not found: {target}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
