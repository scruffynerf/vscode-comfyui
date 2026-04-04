#!/usr/bin/env python3
"""
Generate agent-docs/comfyai/nodes/capability/index.md (router) and
agent-docs/comfyai/nodes/capability/<slug>.md (one file per bucket).

For each top-N pack (from comfy-registry-cache.json), looks up its node class
names in ComfyUI-Manager's extension-node-map.json (all channels), then checks
which capability buckets apply based on keyword matching against the class names.
A pack can appear in multiple buckets.

Usage:
  python3 tools/generate_capability_index.py [--top N]

  --top N    number of packs to consider (default 100, matches popular-nodes.py)
"""

import argparse
import json
import re
from pathlib import Path

ROOT         = Path(__file__).parent.parent
CACHE        = ROOT / "referencecode" / "comfy-registry-cache.json"
APPMANA      = ROOT / "referencecode" / "appmana packages.json"
VETO         = ROOT / "tools" / "popular-nodes-veto.json"
TRANSFORMS   = ROOT / "tools" / "node-name-transforms.json"
MANAGER      = ROOT / "referencecode" / "ComfyUI-Manager" / "node_db"
NODES_DIR    = ROOT / "agent-docs" / "comfyai" / "nodes"
CAP_DIR      = NODES_DIR / "capability"
ROUTER_OUT   = CAP_DIR / "index.md"

MANAGER_CHANNELS = ["dev", "tutorial", "new", "forked", "legacy"]

# ── capability buckets ────────────────────────────────────────────────────────
# Each entry: (label, slug, one-line description, [keywords])
# Keywords prefixed ~ are matched as raw substrings on the lowercased original
# class name (handles compound proper nouns like "controlnet" that the
# CamelCase splitter would split into two words).
# All other keywords use word-boundary matching on normalised text.
BUCKETS = [
    ("Text / Prompts",        "text-prompts",
     "String manipulation, prompt building, token counting, captioning",
     ["text", "string", "prompt", "caption", "token", "word", "sentence"]),

    ("Image processing",      "image-processing",
     "Color correction, blending, compositing, filtering, pixel-level edits",
     ["color", "colour", "blend", "composite", "filter",
      "brightness", "contrast", "hue", "saturation", "pixel", "rgb", "sharpen"]),

    ("Masks",                 "masks",
     "Mask creation, manipulation, background removal, alpha operations",
     ["mask", "matting", "cutout", "alpha", "rembg", "background"]),

    ("Inpainting",            "inpainting",
     "Inpainting, outpainting, and smart fill",
     ["inpaint", "outpaint", "fill"]),

    ("Latent / Noise",        "latent-noise",
     "Latent tensor ops, noise injection, guidance, CFG manipulation",
     ["latent", "noise", "ksampler", "denoise", "cfg", "guidance"]),

    ("Sampling / Schedulers", "sampling-schedulers",
     "Custom samplers, scheduler curves, sigma manipulation",
     ["sampler", "scheduler", "sigmas", "steps"]),

    ("LoRA / Embeddings",     "lora-embeddings",
     "LoRA loading, stacking, trigger words, textual inversion",
     ["lora", "embedding", "lycoris", "textual_inversion"]),

    ("Models / Loaders",      "models-loaders",
     "Checkpoint, UNet, and diffusion model loading and management",
     ["checkpoint", "unet", "diffusion_model", "modelloader", "model_loader"]),

    ("CLIP / VAE",            "clip-vae",
     "CLIP text encoders, VAE encode/decode, conditioning",
     ["clip", "vae", "encoder", "decoder"]),

    ("ControlNet / Adapters", "controlnet-adapters",
     "ControlNet, IP-Adapter, InstantID, PuLID — spatial and style conditioning",
     ["adapter", "~controlnet", "~ipadapter", "~instantid", "~pulid"]),

    ("Segmentation",          "segmentation",
     "SAM, GroundingDINO, object detection, background removal",
     ["segment", "sam", "sam2", "dino", "detect", "rembg", "matting"]),

    ("Face / Portrait",       "face-portrait",
     "Face swap, face enhancement, live portrait, expression transfer",
     ["face", "portrait", "head", "expression", "landmark", "reactor", "liveportrait"]),

    ("Upscaling",             "upscaling",
     "Super-resolution, tile upscaling, ESRGAN, SwinIR variants",
     ["upscale", "upscaler", "esrgan", "swinir", "super_resolution",
      "superresolution", "realesrgan"]),

    ("Video / Frames",        "video-frames",
     "Video loading/saving, frame extraction, interpolation, temporal ops",
     ["video", "frame", "animation", "temporal", "interpolat", "optical_flow"]),

    ("Audio",                 "audio",
     "Audio loading, separation, TTS, music generation",
     ["audio", "sound", "music", "speech", "tts", "voice", "melband"]),

    ("3D / Depth",            "3d-depth",
     "Depth estimation, normal maps, 3D mesh, NeRF",
     ["depth", "normal_map", "mesh", "3d", "pointcloud", "nerf"]),

    ("LLM / Vision-Language", "llm-vision",
     "Large language models, vision-language models, image captioning via AI",
     ["llm", "llava", "ollama", "gemini", "florence", "caption", "vlm",
      "internvl", "minicpm", "qwen"]),

    ("Math / Logic",          "math-logic",
     "Arithmetic, boolean logic, type conversion (int/float/bool)",
     ["math", "logic", "integer", "float", "boolean"]),

    ("File / IO",             "file-io",
     "File paths, directory ops, reading/writing non-image files",
     ["file", "path", "directory", "read", "write", "export", "import"]),
]

UNCATEGORIZED_LABEL = "Utility / Other"
UNCATEGORIZED_SLUG  = "utility-other"
UNCATEGORIZED_DESC  = "Packs that matched no specific bucket"

# ── exclusion rules ───────────────────────────────────────────────────────────
# If a pack matches any bucket in column 0, remove it from buckets in column 1.
EXCLUSION_RULES: list[tuple[list[str], list[str]]] = [
    (["Video / Frames"],        ["Text / Prompts", "CLIP / VAE", "File / IO", "Sampling / Schedulers"]),
    (["Audio"],                 ["Text / Prompts", "File / IO"]),
    (["LLM / Vision-Language"], ["Text / Prompts"]),
    (["Face / Portrait"],       ["Segmentation"]),
]

# ── CamelCase normaliser ──────────────────────────────────────────────────────
_CAMEL_SPLIT_1 = re.compile(r'([A-Z]+)([A-Z][a-z])')   # CLIPText  → CLIP Text
_CAMEL_SPLIT_2 = re.compile(r'([a-z\d])([A-Z])')        # drawText  → draw Text
_SEPARATORS     = re.compile(r'[_\-|+\s]+')

def _normalize(name: str) -> str:
    s = _CAMEL_SPLIT_1.sub(r'\1 \2', name)
    s = _CAMEL_SPLIT_2.sub(r'\1 \2', s)
    return _SEPARATORS.sub(' ', s).lower()


# ── data loading ──────────────────────────────────────────────────────────────

def load_transforms() -> tuple[dict[str, str], dict[str, str]]:
    """Return (strip_prefix, strip_suffix) dicts keyed by pack id."""
    if not TRANSFORMS.exists():
        return {}, {}
    with open(TRANSFORMS) as f:
        data = json.load(f)
    prefixes = {k: v for k, v in data.get("strip_prefix", {}).items() if not k.startswith("_")}
    suffixes = {k: v for k, v in data.get("strip_suffix", {}).items() if not k.startswith("_")}
    return prefixes, suffixes


def load_appmana() -> tuple[set[str], set[str]]:
    """Return (set of home_page URLs lowercased, set of package names lowercased)."""
    with open(APPMANA) as f:
        data = json.load(f)
    repos = {p["home_page"].rstrip("/").lower() for p in data if p.get("home_page")}
    names = {p["name"].lower() for p in data}
    return repos, names


def load_veto() -> set[str]:
    if not VETO.exists():
        return set()
    with open(VETO) as f:
        data = json.load(f)
    return {e["id"] for e in data.get("vetoed", [])}


def load_extension_map() -> dict[str, list[str]]:
    merged: dict[str, list[str]] = {}
    for ch in MANAGER_CHANNELS:
        p = MANAGER / ch / "extension-node-map.json"
        if not p.exists():
            continue
        with open(p) as f:
            for url, value in json.load(f).items():
                key = url.rstrip("/").lower()
                if key not in merged:
                    merged[key] = value[0] if isinstance(value[0], list) else value
    return merged


def get_top_packs(top_n: int, vetoed: set[str]) -> list[dict]:
    with open(CACHE) as f:
        all_nodes = json.load(f)

    active = [
        n for n in all_nodes
        if n.get("status") == "NodeStatusActive"
        and not n.get("latest_version", {}).get("deprecated", False)
        and n.get("id") not in vetoed
    ]

    seen_repos: dict[str, dict] = {}
    for n in active:
        repo = n.get("repository", "").rstrip("/").lower()
        if not repo:
            seen_repos[n["id"]] = n
            continue
        if repo not in seen_repos or n.get("downloads", 0) > seen_repos[repo].get("downloads", 0):
            seen_repos[repo] = n

    ranked = sorted(seen_repos.values(),
                    key=lambda n: (n.get("downloads", 0), n.get("github_stars", 0)),
                    reverse=True)
    return ranked[:top_n]


# ── classification ────────────────────────────────────────────────────────────

def classify_pack(node_classes: list[str]) -> dict[str, list[str]]:
    """Return {bucket_label: [matching_node_class, ...]} after exclusions."""
    normalized = {c: _normalize(c) for c in node_classes}

    def _hits(node_class: str, keywords: list[str]) -> bool:
        norm = normalized[node_class]
        raw  = node_class.lower()
        for kw in keywords:
            if kw.startswith("~"):
                if kw[1:] in raw:
                    return True
            elif re.search(r'\b' + re.escape(kw) + r'\b', norm):
                return True
        return False

    matched: dict[str, list[str]] = {}
    for label, _slug, _desc, keywords in BUCKETS:
        hits = [c for c in node_classes if _hits(c, keywords)]
        if hits:
            matched[label] = hits

    if not matched:
        return {UNCATEGORIZED_LABEL: []}

    matched_set = set(matched)
    excluded: set[str] = set()
    for specific, generic in EXCLUSION_RULES:
        if any(b in matched_set for b in specific):
            excluded.update(generic)

    result = {b: hits for b, hits in matched.items() if b not in excluded}
    return result or {UNCATEGORIZED_LABEL: []}


# ── rendering ─────────────────────────────────────────────────────────────────

def _entry_lines(entries: list[tuple], appmana_repos: set[str], appmana_names: set[str],
                 transforms: tuple[dict[str, str], dict[str, str]]) -> list[str]:
    strip_prefix, strip_suffix = transforms
    lines = []
    for _cnt, _dl, nid, name, repo, matched_nodes in entries:
        name_part = f"[{name}]({repo})" if repo else name
        prefix = strip_prefix.get(nid, "")
        suffix = strip_suffix.get(nid, "")
        node_names = [n[len(prefix):] if prefix and n.startswith(prefix) else n for n in matched_nodes]
        node_names = [n[:-len(suffix)] if suffix and n.endswith(suffix) else n for n in node_names]
        preview = ", ".join(node_names)
        in_appmana = (repo.rstrip("/").lower() in appmana_repos) or (nid.lower() in appmana_names)
        if in_appmana:
            id_part = f"`{nid}`"
        else:
            id_part = f"git-only ([install guide](../hiddenswitch/install-custom-nodes.md))"
        count_hint = f" *({len(node_names)} nodes)*" if len(node_names) > 1 else ""
        lines.append(f"- {id_part} — {name_part}{count_hint}: {preview}")
    return lines


def build_router(bucket_results: dict[str, list[tuple]], no_data: list[dict]) -> str:
    """Small routing table — one row per non-empty bucket."""
    lines = [
        "# Capability Index",
        "",
        "Find custom node packs by what they can do.",
        "Each link leads to a focused list with the specific nodes that matched.",
        "",
        "> **These packs may not be installed in your environment.** Always check `node-registry.json` first (Step 1 in [find-a-node.md](../find-a-node.md)) before using a node from this index.",
        "",
        "| Task area | File |",
        "|-----------|------|",
    ]
    for label, slug, desc, _kw in BUCKETS:
        if bucket_results.get(label):
            lines.append(f"| {desc} | [{slug}.md]({slug}.md) |")

    if bucket_results.get(UNCATEGORIZED_LABEL):
        lines.append(f"| {UNCATEGORIZED_DESC} | [{UNCATEGORIZED_SLUG}.md]({UNCATEGORIZED_SLUG}.md) |")

    lines.append("")
    return "\n".join(lines) + "\n"


def build_bucket_file(label: str, slug: str, desc: str, entries: list[tuple],
                      appmana_repos: set[str], appmana_names: set[str],
                      transforms: tuple[dict[str, str], dict[str, str]]) -> str:
    lines = [
        f"# {label}",
        "",
        desc,
        "",
        "> **These packs may not be installed in your environment.** Cross-check `node-registry.json` before using any node — see Step 1 in [find-a-node.md](../find-a-node.md).",
        "",
        "Sorted by number of matching nodes (most relevant first).",
        "",
    ]
    lines.extend(_entry_lines(entries, appmana_repos, appmana_names, transforms))
    lines.extend([
        "",
        "---",
        "",
        "To install a pack from this list:",
        "```bash",
        "cd {installDir}",
        "uv pip install --extra-index-url https://nodes.appmana.com/simple/ <id>",
        "```",
        "Then restart the ComfyUI server.",
        "",
        "← [Capability Index](index.md)",
    ])
    return "\n".join(lines) + "\n"


# ── main ──────────────────────────────────────────────────────────────────────

def build_all(top_n: int = 100) -> None:
    vetoed         = load_veto()
    ext_map        = load_extension_map()
    top_packs      = get_top_packs(top_n, vetoed)
    appmana_repos, appmana_names = load_appmana()
    transforms     = load_transforms()   # (strip_prefix, strip_suffix)

    bucket_entries: dict[str, list[tuple]] = {label: [] for label, *_ in BUCKETS}
    bucket_entries[UNCATEGORIZED_LABEL] = []
    no_data: list[dict] = []

    for pack in top_packs:
        repo        = pack.get("repository", "").rstrip("/").lower()
        node_classes = ext_map.get(repo)
        if node_classes is None:
            no_data.append(pack)
            continue

        bucket_map = classify_pack(node_classes)
        for b, matched_nodes in bucket_map.items():
            entry = (
                len(matched_nodes),
                pack.get("downloads", 0),
                pack["id"],
                pack.get("name", pack["id"]),
                pack.get("repository", ""),
                matched_nodes,
            )
            bucket_entries.setdefault(b, []).append(entry)

    for entries in bucket_entries.values():
        entries.sort(key=lambda e: (e[0], e[1]), reverse=True)

    # Write router
    router = build_router(bucket_entries, no_data)
    ROUTER_OUT.write_text(router)
    print(f"Wrote {ROUTER_OUT.relative_to(ROOT)}")

    # Write per-bucket files
    CAP_DIR.mkdir(parents=True, exist_ok=True)
    for label, slug, desc, _kw in BUCKETS:
        entries = bucket_entries.get(label, [])
        if not entries:
            continue
        out = CAP_DIR / f"{slug}.md"
        out.write_text(build_bucket_file(label, slug, desc, entries, appmana_repos, appmana_names, transforms))
        print(f"  {out.relative_to(ROOT)}  ({len(entries)} packs)")

    if bucket_entries.get(UNCATEGORIZED_LABEL):
        out = CAP_DIR / f"{UNCATEGORIZED_SLUG}.md"
        out.write_text(build_bucket_file(
            UNCATEGORIZED_LABEL, UNCATEGORIZED_SLUG, UNCATEGORIZED_DESC,
            bucket_entries[UNCATEGORIZED_LABEL], appmana_repos, appmana_names, transforms))
        print(f"  {out.relative_to(ROOT)}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--top", type=int, default=100)
    parser.add_argument("--refresh", action="store_true",
                        help="ignored; cache is shared with popular-nodes script")
    args = parser.parse_args()
    build_all(top_n=args.top)


if __name__ == "__main__":
    main()
