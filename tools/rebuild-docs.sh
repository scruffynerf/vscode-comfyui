#!/usr/bin/env bash
# Rebuild all auto-generated agent docs.
# Run from the repo root:  bash tools/rebuild-docs.sh [--refresh]
#
# --refresh   re-fetch from the Comfy Registry API (slow, ~40 pages)
#             omit to reuse referencecode/comfy-registry-cache.json

set -euo pipefail
cd "$(dirname "$0")/.."

REFRESH="${1:-}"

echo "==> Popular nodes list"
python3 tools/generate_popular_nodes_doc.py $REFRESH

echo "==> Capability index"
python3 tools/generate_capability_index.py

echo "==> Search indexes"
python3 tools/generate_search_indexes.py

echo "==> Done."
