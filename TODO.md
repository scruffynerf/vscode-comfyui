# TODO

Prioritized implementation backlog. Items are roughly ordered by: usefulness to agents/users, implementation difficulty, and dependency on other items.

---

## From test session 2026-04-03 — agent feedback (opencode, ~45 min evaluation)

### P1 — Critical bugs (core feature broken)

- ✅ **BUG-1: Patch/trigger mechanism never applies changes to live workflow** — Root cause: the bridge JS (`vscode_bridge.js` in the integration node) only handled `updateComfyState` which called `loadGraphData`. Rewrote: patch mode now sends `applyPatch` command which updates nodes in-place via LiteGraph API (`graph.getNodeById`, `pos`, `widgets`, `LiteGraph.createNode` + `graph.add`, `node.connect`). Full workflow mode (`sourcePath`) still uses `loadGraphData` intentionally.
- ✅ **BUG-2: Patches create new tabs instead of editing current workflow in place** — Root cause confirmed via frontend source: `loadGraphData` always calls `useWorkflowService().beforeLoadNewGraph()`, which calls `createNewTemporary()` → new tab, unless the 4th arg is a live workflow object (inaccessible from bridge extensions). Fix: `applyPatch` command bypasses `loadGraphData` entirely, operating directly on `app.graph` via LiteGraph API. No new tabs.
- ✅ **Queue command was also broken** — bridge JS had no handler for `queueWorkflow`. Fixed: added handler calling `app.queuePrompt(0, 1)`.

### P2 — Routing/doc fixes (agent misdirected to hiddenswitch)

- ✅ **DOC: comfyai/README.md routing** — Added explicit third case: "Queue/run the workflow currently in the panel → GUI bridge `queue` command, not hiddenswitch."
- ✅ **DOC: hiddenswitch/README.md gate** — Added explicit example: "run the workflow" = GUI bridge `queue` command if the user wants to see it in the panel.

### P3 — Doc fixes (agent wasted time on broken/undocumented paths)

- ✅ **DOC: run-workflow.md — macOS embedded Python crash** — Added `if __name__ == '__main__':` guard and explanation.
- ✅ **DOC: run-workflow.md — reliability ranking** — Added table: CLI first, then embedded, then remote client. Known failure modes for each.
- ✅ **DOC: run-workflow.md — Path 3 remote client silent failure** — Documented API-format requirement; added assertion check for 0-byte result.
- ✅ **DOC: comfyai/README.md — timestamp guidance** — Clarified: any incrementing integer works, `Date.now()/1000` was JS-only advice.
- ✅ **DOC: comfyai/README.md — partial update example** — Added explicit example of id+pos-only patch preserving all other fields.
- ✅ **DOC: comfyai/README.md — empty workflow-state guidance** — Added section explaining zero-node state and what to do.
- ✅ **DOC: comfyai/README.md — debugging section** — Added `user/comfyui.log` location and what to look for.
- ✅ **DOC: hiddenswitch/reference/models.md — add_known_models() clarification** — Clarified: registers for embedded client only, does NOT download immediately, not visible to server/CLI/panel.

### P4 — Discuss / investigate (open)

- ✅ **DISCUSS: apply-response.json** — Extension now writes `comfyai/apply-response.json` after every trigger (patch, full workflow, queue, interrupt). Schema: `{status, ts, message}`. Documented in `comfyai/README.md`.
- ✅ **DISCUSS: available-models.json** — Extension now writes `comfyai/available-models.json` during node catalog build (on panel open / refresh). Extracts COMBO inputs from known loader nodes (CheckpointLoaderSimple, VAELoader, LoraLoader, ControlNetLoader, etc.). Documented in `comfyai/README.md`.
- ✅ **DISCUSS: venv/ search guidance** — Added nuanced guidance to `hiddenswitch/README.md` installation context section: use `pip list` for package presence, targeted paths for source reading, never glob the whole tree. Also added directory notes to `COMFYUI_AGENT_GUIDE.md`.

### P5 — Optimize (open)

- ✅ **OPTIMIZE: nodes/README.md — node-registry.json size estimate** — Added: "~1.8 MB / ~450k tokens" to the "do not read the whole file" warning.

### Low-priority report items (from test1/report.md)

- ✅ **LOW-3: Sync model** — Documented in `comfyai/README.md`: one-direction automatic sync, full patch flow, "never write workflow-state.readonly.json directly."
- ✅ **LOW-4: venv/ note in agent guide** — Added directory notes section to `COMFYUI_AGENT_GUIDE.md` covering venv/ and models/.
- ✅ **LOW-5: node-registry.json size estimate** — Done (same as P5 above).
- ✅ **LOW-6: Harmless dylib warnings** — Documented in `hiddenswitch/run-workflow.md` as expected and ignorable.
- ✅ **LOW-7: Troubleshooting section** — Added to `comfyai/README.md`: patch didn't appear, queue did nothing, model not found, empty workflow.

### TBD — discuss before implementing

- ✅ **TBD: LOW-1: auto-layout command** — `{"command": "auto-layout", "ts": n}` trigger. Implemented: bridge JS calls `app.graph.arrange()` + `setDirtyCanvas`. Handler added to patchBridge, panel, and bridge JS. Documented in `comfyai/README.md`. Note: groups not repositioned, only nodes.
- ⬜ **TBD: LOW-2: tab awareness** — Write `comfyai/tabs.json` exposing active tab index, tab names, and node counts. Blocked: tab state lives in Vue pinia composable (`useWorkflowService().openWorkflows`), not accessible as a plain global from bridge JS. **Discuss with hiddenswitch dev**: does the fork expose `app.workflowManager` or equivalent? Until confirmed, DOM scraping is the only fallback (fragile).
- ✅ **TBD: LOW-8: alternative trigger mechanism** — Targeted cold-start fix implemented: on watcher creation, checks if `apply-patch-trigger.json` mtime is newer than `apply-response.json` mtime; if so, processes the trigger immediately. Handles missed writes from before extension activation. Full HTTP-endpoint alternative deferred — file watcher is reliable for local workspaces; HTTP only needed for remote/container scenarios.

### Needs testing

- ⬜ **TEST: patch/trigger end-to-end** — BUG-1 fix addresses the bridge JS side. Still need to verify the file watcher in `patchBridge.ts` actually fires in a fresh install scenario (was not confirmed — BUG-1 may have had two causes: watcher not firing AND wrong message type). Test with a real agent session.
- ⬜ **TEST: install command "not empty" fix** — `ensureAgentGuide` runs on activation before the install command, creating `comfyai/` and `COMFYUI_AGENT_GUIDE.md`. Fixed to filter those out of the "not empty" check. Verify on a clean workspace.

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
