#!/usr/bin/env python3
"""
Generate two search index files deployed to comfyai/nodes/:

  registry-search.json   — slim pack metadata for keyword search (id/name/desc/repo)
  node-class-search.json  — pack-centric list of node class names, for class-name search

Usage:
  python3 tools/generate_search_indexes.py

Both files use the shared registry cache (referencecode/comfy-registry-cache.json).
"""

import json
from pathlib import Path

ROOT      = Path(__file__).parent.parent
CACHE     = ROOT / "referencecode" / "comfy-registry-cache.json"
MANAGER   = ROOT / "referencecode" / "ComfyUI-Manager" / "node_db"
NODES_DIR = ROOT / "agent-docs" / "comfyai" / "nodes"

MANAGER_CHANNELS = ["dev", "tutorial", "new", "forked", "legacy"]


def load_active() -> list[dict]:
    with open(CACHE) as f:
        all_nodes = json.load(f)
    return [
        n for n in all_nodes
        if n.get("status") == "NodeStatusActive"
        and not n.get("latest_version", {}).get("deprecated", False)
    ]


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


def build_registry_search(active: list[dict]) -> list[dict]:
    """Slim pack metadata for id/name/description keyword search."""
    return [
        {
            "id":   n["id"],
            "name": n.get("name", ""),
            "desc": n.get("description", ""),
            "repo": n.get("repository", ""),
        }
        for n in active
        if n.get("downloads", 0) > 0
    ]


def build_node_class_index(active: list[dict], ext_map: dict[str, list[str]]) -> list[list]:
    """Pack-centric node class list: [[id, name, repo, [class, ...]], ...]
    Only includes packs cross-referenced in the Manager map and with downloads > 0."""
    repo_to_pack = {}
    for n in active:
        repo = n.get("repository", "").rstrip("/").lower()
        if repo and n.get("downloads", 0) > 0:
            repo_to_pack[repo] = (n["id"], n.get("name", ""), n.get("repository", ""))

    entries = []
    for url, classes in ext_map.items():
        pack = repo_to_pack.get(url)
        if not pack:
            continue
        pack_id, name, repo = pack
        entries.append([pack_id, name, repo, classes])

    return entries


def main() -> None:
    active  = load_active()
    ext_map = load_extension_map()

    reg_search = build_registry_search(active)
    out_a = NODES_DIR / "registry-search.json"
    out_a.write_text(json.dumps(reg_search, separators=(",", ":")))
    print(f"Wrote {out_a.relative_to(ROOT)}  ({len(reg_search)} packs, {out_a.stat().st_size//1024} KB)")

    class_index = build_node_class_index(active, ext_map)
    out_c = NODES_DIR / "node-class-search.json"
    out_c.write_text(json.dumps(class_index, separators=(",", ":")))
    print(f"Wrote {out_c.relative_to(ROOT)}  ({len(class_index)} packs, {out_c.stat().st_size//1024} KB)")


if __name__ == "__main__":
    main()
