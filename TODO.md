# TODO

Prioritized implementation backlog. Items are roughly ordered by: usefulness to agents/users, implementation difficulty, and dependency on other items.

---

## Tier 1 — High value, low complexity

_(All Tier 1 items done, targeting 2.1.0 — see CHANGELOG for details.)_

---

## Tier 2 — High value, moderate complexity

_(All Tier 2 items done, targeting 2.1.0 — see CHANGELOG for details.)_

---

## Tier 3 — Significant value, higher complexity or dependency

- **Node knowledge library** — ✅ Core infrastructure done. Remaining work is curation and content.
  - ✅ Node catalog (index.md, per-class files, node-registry.json)
  - ✅ appmana pip catalog (2559 packages with summaries, `comfyai/nodes/appmana-catalog.json`)
  - ✅ `find-a-node.md` — 4-step discovery hierarchy, all steps complete
  - ✅ `install-custom-nodes.md` — UV install patterns + pip safety note
  - ✅ Popular nodes list (`popular-nodes.md`) — top 100 from Comfy Registry, by category
  - ✅ Capability index — router (`capability/index.md`) + 18 per-bucket detail files
  - ✅ `registry-search.json` (~2600 packs: id/name/desc/repo, keyword-searchable)
  - ✅ `node-class-search.json` (~1700 packs: class-name search, pack-centric)
  - ✅ `tools/rebuild-docs.sh` — single command to regenerate all docs
  - ⬜ Curation (ongoing):
      - `tools/popular-nodes-descriptions.json` — agent-friendly description overrides
      - `tools/popular-nodes-veto.json` — review remaining duplicates/deprecated packs
      - `tools/popular-nodes-includes.json` — must-include packs below rank 100
      - `tools/node-name-transforms.json` — prefix/suffix strips for noisy node class names
  - ⬜ `knowledge_base.md` — common workflow patterns and usage examples (stub, low priority)

- **GraphBuilder → GUI panel** — Unblocked when hiddenswitch dev answers the open Qs in `hiddenswitch/graphbuilder.md`. Until then, GraphBuilder output can only be *run*, not *shown*.

- **Workflow diffing**: Semantic diff between two workflow JSONs — show what nodes/links were added, removed, or changed, in human-readable form. Useful for reviewing agent changes and understanding iteration history.

---
