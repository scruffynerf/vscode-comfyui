# Release Prep — Updating Generated Docs

Run these before a release to refresh all auto-generated agent docs.

## Rebuild everything (normal)

```bash
bash tools/rebuild-docs.sh
```

Uses the cached registry snapshot (`referencecode/comfy-registry-cache.json`).

## Rebuild with fresh API data

```bash
bash tools/rebuild-docs.sh --refresh
```

Re-fetches from the Comfy Registry API (~40 pages, slow). Do this when new packs have been published or download counts have shifted significantly.

## Individual scripts (if needed)

```bash
python3 tools/generate_popular_nodes_doc.py [--refresh]
python3 tools/generate_capability_index.py
```

Run `generate_popular_nodes_doc.py` first when refreshing — both scripts share the same cache file.

## Curation files (edit by hand)

| File | Purpose |
|------|---------|
| `tools/popular-nodes-veto.json` | Exclude a pack from popular-nodes.md |
| `tools/popular-nodes-includes.json` | Force-include a pack regardless of rank |
| `tools/popular-nodes-descriptions.json` | Override a pack's description with an agent-friendly one |

Changes to these files take effect on the next run of `generate_popular_nodes_doc.py`.
