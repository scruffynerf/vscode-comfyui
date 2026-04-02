#!/usr/bin/env python3
"""
Generate agent-docs/comfyai/nodes/popular-nodes.md from the Comfy Registry API.

Usage:
  python3 tools/generate_popular_nodes_doc.py [--top N] [--refresh]

  --top N      number of entries to include (default 50)
  --refresh    re-fetch from API even if cache exists

Cache: referencecode/comfy-registry-cache.json
Output: agent-docs/comfyai/nodes/popular-nodes.md

The `id` field from the registry is the pip install name:
  pip install <id>    (via nodes.appmana.com wheels)
"""

import argparse
import json
import re
import time
import urllib.request
from pathlib import Path

ROOT     = Path(__file__).parent.parent
CACHE    = ROOT / "referencecode" / "comfy-registry-cache.json"
APPMANA  = ROOT / "referencecode" / "appmana packages.json"
VETO     = ROOT / "tools" / "popular-nodes-veto.json"         # manually maintained exclusion list
INCLUDES = ROOT / "tools" / "popular-nodes-includes.json"     # must-include overrides (always added regardless of rank)
DESCS    = ROOT / "tools" / "popular-nodes-descriptions.json" # agent-friendly description overrides
OUT      = ROOT / "agent-docs" / "comfyai" / "nodes" / "popular-nodes.md"

API_BASE = "https://api.comfy.org/nodes"
LIMIT    = 100  # max page size

# ── category rules ────────────────────────────────────────────────────────────
# Each rule is (category, id_pattern, broad_pattern).
# id_pattern matches against the node id/name only (more specific).
# broad_pattern matches against id+name+description (less specific).
# First match wins, so order matters.
CATEGORIES_RULES = [
    # category                       id/name pattern                    broad pattern
    ("General utilities",        r"kjnodes|rgthree|easy.use|essentials|custom.script|was.n|mxtoolkit|fill.node|artventure|impact.pack|impact.subpack",
                                  r""),
    ("Workflow / UI utilities",  r"crystools|lora.manager|jakeupgrade|logic\b|detail.daemon|memory.cleanup|multigpu",
                                  r"workflow.*util|ui.*enh"),
    ("Data handling",            r"basic.data|data.handl|derfuu",
                                  r"json\b.*node|csv.*node"),
    ("Quantization / memory",    r"gguf",
                                  r"bitsandbytes|nf4|quant|offload.*vram"),
    ("Inference optimization",   r"wavespeed|fsampler|stable.fast|teacache|nunchaku|sparseattn",
                                  r"inference.*optim|lcm.sampler|block.?swap"),
    ("ControlNet / conditioning", r"controlnet|ipadapter|ip.adapter|controlalt",
                                  r"controlnet|ip.adapter"),
    ("Image restoration / upscaling", r"upscal|diffbir|aurasr|supir|seedvr|ttp.tool",
                                  r"super.resol|realesrgan|swinir"),
    ("Segmentation / masking",   r"segment|rmbg|birefnet|groundingdino|matting|inpaint.crop",
                                  r"\bsam\b|remove.*background|background.*remov|inpaint.*crop"),
    ("Face / portrait / body",   r"face|reactor|pulid|instantid|infiniteyou|faceaging|leffa|liveportrait",
                                  r"face.swap|face.enhance|portrait"),
    ("LLM / vision-language",    r"gemini|ollama|caption|dspy|minicpm|internvl|florence|mikey",
                                  r"\bllm\b|llava|mistral|\bllama\b|vision.language"),
    ("Image / prompt utilities", r"prompt|interrogat|image2prompt|inpaint|crop",
                                  r""),
    ("Video generation",         r"video|hunyuanvideo|wanvideo|framepac|mochi\b|mmaudio|venhancer|easyanimate|followyour|diffsynth|frame.interpol",
                                  r""),
    ("Audio / speech",           r"audio|tts\b|speech|music|mmaudio|melband",
                                  r""),
    ("3D / mesh",                r"3d|trellis|hunyuan3d|unique3d|hi3dgen|voxcpm|unirig",
                                  r"\bmesh\b|skeleton.*3d"),
]

CATEGORIES = [(cat, "") for cat, _, _ in CATEGORIES_RULES]

def classify(node: dict) -> str:
    nid   = (node.get("id", "") + " " + node.get("name", "")).lower()
    broad = (nid + " " + node.get("description", "") + " " + " ".join(node.get("tags", []))).lower()
    for cat, id_pat, broad_pat in CATEGORIES_RULES:
        if id_pat and re.search(id_pat, nid):
            return cat
        if broad_pat and re.search(broad_pat, broad):
            return cat
    return "General utilities"  # first category, so unmatched nodes land there

def fetch_all_nodes(refresh: bool = False) -> list[dict]:
    if CACHE.exists() and not refresh:
        print(f"Using cache: {CACHE.relative_to(ROOT)}")
        with open(CACHE) as f:
            return json.load(f)

    print("Fetching from Comfy Registry API…")
    all_nodes = []
    page = 1
    while True:
        url = f"{API_BASE}?page={page}&limit={LIMIT}"
        req = urllib.request.Request(url, headers={"User-Agent": "vscode-comfyui-doc-gen/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())

        batch = data.get("nodes", [])
        all_nodes.extend(batch)
        total_pages = data.get("totalPages", 1)
        print(f"  page {page}/{total_pages}  ({len(all_nodes)} nodes so far)", end="\r")

        if page >= total_pages or not batch:
            break
        page += 1
        time.sleep(0.1)  # be polite

    print(f"\nFetched {len(all_nodes)} nodes total.")
    CACHE.parent.mkdir(exist_ok=True)
    with open(CACHE, "w") as f:
        json.dump(all_nodes, f, indent=2)
    print(f"Saved cache: {CACHE.relative_to(ROOT)}")
    return all_nodes

def load_desc_overrides() -> dict[str, str]:
    """Load manually curated description overrides keyed by node id."""
    if not DESCS.exists():
        return {}
    with open(DESCS) as f:
        data = json.load(f)
    return data.get("overrides", {})

def load_includes() -> set[str]:
    """Load node ids that must always appear regardless of rank."""
    if not INCLUDES.exists():
        return set()
    with open(INCLUDES) as f:
        data = json.load(f)
    return {e["id"] for e in data.get("included", [])}

def load_veto() -> set[str]:
    """Load node ids to exclude.  Returns empty set if veto file doesn't exist."""
    if not VETO.exists():
        return set()
    with open(VETO) as f:
        data = json.load(f)
    return {e["id"] for e in data.get("vetoed", [])}

def load_appmana() -> tuple[set[str], set[str]]:
    """Return (set of home_page URLs lowercased, set of package names lowercased)."""
    with open(APPMANA) as f:
        data = json.load(f)
    repos = {p["home_page"].rstrip("/").lower() for p in data if p.get("home_page")}
    names = {p["name"].lower() for p in data}
    return repos, names

def build_doc(nodes: list[dict], top_n: int = 50) -> str:
    vetoed        = load_veto()
    forced        = load_includes()
    desc_overrides = load_desc_overrides()
    appmana_repos, appmana_names = load_appmana()

    def in_appmana(n: dict) -> bool:
        repo = n.get("repository", "").rstrip("/").lower()
        nid  = n.get("id", "").lower()
        return repo in appmana_repos or nid in appmana_names

    # Filter: only active, not vetoed, not deprecated
    active = [
        n for n in nodes
        if n.get("status") == "NodeStatusActive"
        and not n.get("latest_version", {}).get("deprecated", False)
        and n.get("id") not in vetoed
    ]

    # Deduplicate: when the same GitHub repo has multiple package IDs, keep the
    # one with higher downloads (usually the canonical one).
    seen_repos: dict[str, dict] = {}
    for n in active:
        repo = n.get("repository", "").rstrip("/").lower()
        if not repo:
            seen_repos[n["id"]] = n
            continue
        if repo not in seen_repos or n.get("downloads", 0) > seen_repos[repo].get("downloads", 0):
            seen_repos[repo] = n
    deduped = list(seen_repos.values())

    # Sort by downloads desc, tie-break by github_stars
    ranked = sorted(deduped, key=lambda n: (n.get("downloads", 0), n.get("github_stars", 0)), reverse=True)
    top = ranked[:top_n]

    # Merge forced includes that didn't make the top N cut
    top_ids = {n["id"] for n in top}
    by_id   = {n["id"]: n for n in deduped}
    for fid in forced:
        if fid not in top_ids and fid in by_id:
            top.append(by_id[fid])

    # Group by category
    by_cat: dict[str, list] = {cat: [] for cat, _ in CATEGORIES}
    for node in top:
        by_cat[classify(node)].append(node)

    lines = [
        "# Popular Custom Nodes",
        "",
        f"Top {top_n} active nodes from the [Comfy Registry](https://comfyregistry.org), sorted into categories.",
        "The `id` is the `uv pip install` name.  Install via appmana (see [install-custom-nodes.md](hiddenswitch/install-custom-nodes.md)):",
        "",
        "```bash",
        "cd {installDir}",
        "uv pip install --extra-index-url https://nodes.appmana.com/simple/ <id>",
        "```",
        "",
        "Then restart the ComfyUI server.",
        "",
        "Entries marked **git-only** are not yet in the appmana catalog — install from git instead",
        "(see [install-custom-nodes.md](hiddenswitch/install-custom-nodes.md)).",
        "",
    ]

    for cat, _ in CATEGORIES:
        entries = by_cat.get(cat, [])
        if not entries:
            continue
        lines.append(f"## {cat}")
        lines.append("")
        lines.append("| id / install | Name | Description |")
        lines.append("|--------------|------|-------------|")
        for n in entries:
            nid  = n.get("id", "")
            name = n.get("name", nid)
            repo = n.get("repository", "")
            name_cell = f"[{name}]({repo})" if repo else name
            desc = desc_overrides.get(nid) or n.get("description", "")
            desc = desc.replace("\n", " ").replace("|", "\\|")
            desc = re.sub(r"\s+", " ", desc).strip()
            if in_appmana(n):
                install_cell = f"`{nid}`"
            else:
                install_cell = f"git-only — [{nid}]({repo})"
            lines.append(f"| {install_cell} | {name_cell} | {desc} |")
        lines.append("")

    lines.append("---")

    return "\n".join(lines) + "\n"

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--top", type=int, default=100)
    parser.add_argument("--refresh", action="store_true")
    args = parser.parse_args()

    nodes = fetch_all_nodes(refresh=args.refresh)
    doc = build_doc(nodes, top_n=args.top)
    OUT.write_text(doc)
    print(f"Wrote {OUT.relative_to(ROOT)}")

if __name__ == "__main__":
    main()
