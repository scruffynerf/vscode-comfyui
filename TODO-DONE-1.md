# TODO

Prioritized implementation backlog. Items are roughly ordered by: usefulness to agents/users, implementation difficulty, and dependency on other items.

---

## ✅ DONE — Node/Link Deletion in Patch System

**Why**: `mergeWorkflows` only adds/updates nodes and links — there is no removal path. Agents cannot delete a node, disconnect a link, or replace a node's type (which requires delete + recreate) without replacing the entire workflow via `sourcePath`. This blocks structural editing entirely.

**Three-part implementation**:

1. **`mergeWorkflows` in `src/patchBridge.ts`** — add handling for two new optional patch fields:
   - `remove_nodes: number[]` — filter these IDs out of `result.nodes`; also remove any links in `result.links` that reference them (src or dst node ID)
   - `remove_links: number[]` — filter these link IDs out of `result.links`
   - Run removals *before* the add/update pass so a patch can atomically delete-and-replace in one step

2. **Bridge JS in `src/install.ts`** — add handling in `applyPatch`:
   - `patch.remove_nodes`: for each ID, `const n = app.graph.getNodeById(id); if (n) app.graph.remove(n);` — LiteGraph's `remove()` disconnects all links automatically
   - `patch.remove_links`: for each ID, `app.graph.removeLink(id)` — disconnects without removing nodes
   - Process removals *before* adds/updates (same ordering as mergeWorkflows)

3. **Doc in `agent-docs/comfyai/README.md`** — add `remove_nodes` and `remove_links` to the patch section with examples:
   - Delete a node: `{"remove_nodes": [10]}`
   - Disconnect a link: `{"remove_links": [5]}`
   - Replace a node's type (delete + add in one patch): `{"remove_nodes": [10], "nodes": [{"id": 10, "type": "NewType", "pos": [...], ...}]}`

**Note on `app.graph.removeLink`**: verify this API exists in the hiddenswitch frontend version. Fallback: find the link's src node and call `srcNode.disconnectOutput(slot)` or iterate inputs. Check the LiteGraph version in the fork before implementing.

---

## From test session 2026-04-03 — agent feedback (test4, ~45 min evaluation) ✅ ALL DONE

Full notes in `referencecode/feedback/test4/`. Workflow: basic txt2img, agent asked to increase resolution, add color masking, queue multiple seed runs.

### Trivial fixes (node-data.json / doc)

- ✅ **GAP-2: Add seed + control_after to KSampler extractor** — `tools/node-data.json` KSampler rule has `seed@0` and `control_after@1` in its comment schema but excludes them from `fields`. Agent had to parse raw JSON to answer "what seed would be used next?" and didn't know about increment mode. Add both fields so `workflow-summary.md` shows e.g. `seed: 42, control_after: "fixed", steps: 20, ...`. Also add `seed@1` field to the KSamplerAdvanced rule.
- ✅ **GAP-4: COMBO widget type guidance in README** — Agent used `[0]` for ImageToMask channel widget (expects `"red"`). Add one sentence to `comfyai/README.md` patch section: COMBO widgets expect string values — check `node-registry.json` inputs for valid options, never guess a numeric index.
- ✅ **GAP-3 (doc): Verify node type before adding via patch** — Agent added `HSVThresholdMask` node (not installed) via patch; bridge JS silently skipped it (`LiteGraph.createNode` returns null for unregistered types), but apply-response still reported "1 node(s)". Add to `comfyai/README.md`: verify any new node type exists in `node-registry.json` before adding it via patch — if the type isn't registered, the node is silently dropped.
- ✅ **GAP-3 (doc): Auto-layout after adding new nodes** — Agent placed new nodes at positions overlapping existing ones; user couldn't see them. Add to `comfyai/README.md` patch section: after adding new nodes, use `{"command": "auto-layout", "ts": N}` to prevent overlaps.

### Easy code fix

- ✅ **BUG-1: Log filename collision in testing mode** — Extension suggests `log-{triggerTs}.md` (e.g. `log-2.md`) for testing log files. Agent independently wrote orientation notes to `log-2.md` before trigger #2; extension then suggested the same filename and agent overwrote it. Fix in `writeApplyResponse` (`src/patchBridge.ts`): before suggesting a filename, check if `path.join(installDir, testingLogDir, logFileName)` already exists; if so, try `log-{triggerTs}-2.md`, `log-{triggerTs}-3.md`, etc.

### Moderate doc + code

- ✅ **BUG-3 (doc+warn): Node type changes via patch are silently ignored** — Agent patched node 10 with a different `type` field; extension preserved the original type, response said "Patch applied: 1 node(s)". The README already says "type changes drop links" (implying they work), but they don't. Fix: (a) add explicit note to `comfyai/README.md`: "You cannot change an existing node's type via patch — delete the node and add a new one of the correct type with the links reconnected." Remove the misleading "drops its links" wording. (b) In `writeApplyResponse` / patch processing, detect when a patch node has a `type` field that differs from the existing node's type and include a warning in the apply-response message.
- ✅ **GAP-1: Capability docs don't distinguish installed vs. available** — Agent found `HSVThresholdMask` in `nodes/capability/masks.md` and tried to use it without checking `node-registry.json` first. All capability files list packs that are *available for install*, not necessarily installed. Add a warning line near the top of each capability file (add it to `tools/generate_capability_index.py` output template so it persists across rebuilds): "These packs may not be installed in your environment — cross-check `node-registry.json` before using any node." Also add a note to the generated `capability/index.md` header.

### Upstream / won't fix here

- ⬜ **BUG-2 (upstream): HSVThresholdMask outputs 3D tensor incompatible with ImageToMask** — `comfyui-post-processing-nodes` mislabels its output as IMAGE but it's a MASK (3D tensor, no batch dim). `ImageToMask` expects a 4D IMAGE tensor → `IndexError: too many indices for tensor`. Fix belongs in that package. No action needed in this extension. Ticket: https://github.com/EllangoK/ComfyUI-post-processing-nodes/issues/19

### Future / requires design

- ⬜ **FUTURE: Node type change via patch (delete + recreate)** — When a patch changes an existing node's type, the correct behavior is: (1) record the old node's links (inputs/outputs by slot), (2) delete the old node, (3) create a new node of the new type at the same position, (4) reconnect links that are slot-compatible with the new type. This is what users naturally expect ("replace this node with that one"). Needs: track links in bridge JS before deletion, check slot compatibility for reconnect, surface mismatches in apply-response. Defer until there's a real use case — document as unsupported for now (see BUG-3 above).

---

## From test session 2026-04-03 — agent feedback (test3, ~70 min evaluation)

### Doc fixes (all ✅ done)

- ✅ **DOC: workflow-summary.md staleness** — Agents were answering state questions from their cached in-context copy of `workflow-summary.md` (which updates on every panel change) rather than re-reading it. Added explicit warning to `comfyai/README.md` "Reading state efficiently" section: cached copies go stale, always re-read the file.
- ✅ **FIX: server restart now auto-refreshes node catalog** — `restartServer` command in `extension.ts` waited for the server to become responsive but never called `triggerCatalogUpdate`. Added `ComfyUIPanel.triggerCatalogUpdate()` in both `becameResponsive` branches. Docs updated: restart is now a single step, no separate catalog refresh needed.
- ✅ **DOC: class name ≠ registered type name** — No guidance that a node's Python class name may differ from its registered `type` (e.g., `RemBGSession` vs `RemBGSession+`). Added warning to `nodes/README.md`: always verify the exact type key in `node-registry.json` after a catalog refresh.
- ✅ **DOC: uv pip with non-.venv venv** — `uv pip install` auto-detects `.venv/` but fails silently when the venv is named `venv/`. Added `--python {venv}/bin/python` flag example to `install-custom-nodes.md`.
- ✅ **DOC: appmana index fallback** — No guidance when `nodes.appmana.com` is unreachable. Added: "If the index is unreachable, fall back to git install" with pointer to the git section.
- ✅ **DOC: links dropped on node type correction** — Undocumented: correcting a node's `type` in a patch drops existing links. Added warning to `comfyai/README.md` patch section.
- ✅ **DOC: link IDs reassigned by extension** — Agents specified link IDs in patches; extension silently assigned different ones. Added note to `comfyai/README.md`: IDs in patches are ignored, re-read state to get actual IDs.

### Feature items

- ✅ **FEAT: echo trigger `ts` in apply-response.json** — Added `trigger_ts` field to every `apply-response.json`. Threaded `signalData.ts` through all `writeApplyResponse` calls in `patchBridge.ts`.
- ✅ **FEAT: execution result visibility (option B)** — Documented `GET http://localhost:8188/history` in `troubleshooting.md` with a curl snippet and response structure. Queue response message now also contains the reminder to poll `/history`. No extension code needed.
- ✅ **FEAT: agent testing mode** — New `testing-mode` command in trigger file. Sets a log directory; every subsequent `apply-response.json` includes `log_file` (per-action filename keyed to `trigger_ts`) and a `testing_reminder` prompting comprehensive logging of everything since the last entry. Each log entry is a new Write, no read needed.
- ✅ **FEAT: catalog refresh completion signal** — `writeCatalog` in `nodeCatalog.ts` now writes `comfyai/_extension/catalog-refresh-timestamp.json` (`{completedAt, nodeCount}`) after every full build. Agents compare `completedAt` against their action time to confirm the refresh is done. Documented in `nodes/README.md`.

### Behavior / doc items

- ⬜ **NOT A BUG: links dropped on node type correction** — Reclassified. Type changes via patch are intentionally unsupported — the extension warns and ignores them. Dropping links is correct behavior given that the type change itself was rejected. The right approach is explicit delete+recreate using `remove_nodes` (now implemented). No code fix needed; low priority.
- ✅ **DOC: agent entry point gate** — Agents consistently read all docs before receiving a task. Added explicit gate to `COMFYUI_AGENT_GUIDE.md`: "Read this for orientation, then stop and ask the user what they want before reading anything else."

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

## From test session 2026-04-03 — agent evaluation round 2 (opencode, ~90 min)

Full notes in `referencecode/feedback/test2/`. Confirmed: patch/queue/apply-response all work. Issues are docs/metadata/visibility gaps.

### Doc fixes (no dev input needed)

- ✅ **DOC: nodes/index.md dead reference** — `comfyai/README.md` and `nodes/find-a-node.md` both reference `nodes/index.md` which doesn't exist. Fixed to point to `nodes/README.md`.
- ✅ **DOC: ts schema description** — Schema says "Unix timestamp (seconds). Use `Date.now() / 1000`." which is JS-only and implies seconds are required. Fixed: "any monotonically increasing integer".
- ✅ **DOC: model auto-download misunderstanding** — `models.md` says "model must already be on disk" for panel use. Wrong: the hiddenswitch server auto-downloads on first use from its known list. Fixed docs to reflect actual behavior.
- ✅ **DOC: huggingface-cli not in venv** — `models.md` references `huggingface-cli login`. Binary not in venv by default. Fixed: recommend `HF_TOKEN` env var; note CLI install is optional.
- ✅ **DOC: execution_interrupted guidance** — No doc coverage for user-stopped workflows. Agents re-queued after a user interrupt. Added troubleshooting section distinguishing user-stop from crash.
- ✅ **DOC: log reading — use tail** — No guidance on log size. Agent read the full log repeatedly. Added `tail -20` guidance to troubleshooting server log section.
- ✅ **DOC: routing clarity — server already running** — Agents confused about when to use hiddenswitch Python vs. extension triggers vs. direct server API. Added explicit callout: if a server is already running, use the extension triggers or server API — don't start an embedded Python client alongside it.
- ✅ **DOC: novram/M-series performance** — Agents had no context for why generation was slow. Added knowledge note: on Apple Silicon, `--novram` is the recommended default (unified memory, not swap), not a degraded mode. Generation times are normal; CUDA comparisons don't apply.

### Model metadata (needs hiddenswitch dev input)

- ⬜ **MODEL: model type metadata** — `available-models.json` has no field for AIO vs. diffusion-only vs. CLIP-only vs. VAE-only. Agent recommended Chroma1-Base (diffusion-only) as a checkpoint replacement and wasted 26min downloading it. Options: (a) annotation layer the extension merges in, (b) expose from hiddenswitch `/object_info` if the fork adds type info. **Discuss with dev.**
- ⬜ **MODEL: model list completeness** — zimage has a VAE entry in the list but no checkpoint. Agent searched for a zimage checkpoint, found nothing, went to HuggingFace. Need a way to annotate "related/companion files" or "this is a component, not an AIO model." **Discuss with dev.** May need a curated annotation JSON the extension merges into `available-models.json`.
- ⬜ **MODEL: model size info** — No file sizes in `available-models.json`. Agents can't assess VRAM fit before recommending a model. Source unclear — may require a separate metadata file.
- ⬜ **MODEL: add_known_models as panel download path** — Hypothesis: call `add_known_models` + run a minimal hiddenswitch workflow (load-model → model-info) to trigger download to HF cache and symlink into `models/`. Server restart would then pick up the model. **Confirm with dev**: does embedded client actually create symlinks in `installDir/models/`? If yes, this is the cleanest download path for panel use and should be documented. If not, need `hf_hub_download` with `local_dir=installDir/models/checkpoints/`.

### Server visibility / new extension features

- ✅ **FEAT: server-info.json** — Written to `comfyai/server-info.json` on panel open via `/system_stats`. Schema: `{serverUrl, configuredStartupArgs, system, devices, updatedAt}`. Documented in `comfyai/README.md` and referenced in troubleshooting slow-generation section.
- ⬜ **FEAT: model refresh command** — Agent needed to add a new model and restart the server to make it appear. On stock ComfyUI there's a hotkey to refresh model lists (no restart). **Discuss with dev**: (a) does the hiddenswitch fork expose an equivalent API endpoint? (b) what's the difference between model-list refresh vs. hot-reload (reload Python/custom nodes)? Once confirmed, either expose via extension trigger command or document the endpoint agents can call directly.

### Agent behavior / proactive advice (knowledge base + docs)

- ⬜ **KB: pre-flight checklist** — Before queueing, agent should check: step count appropriate for model (Flux Schnell → ≤4 steps, not 20), CFG appropriate (Flux → CFG 1), scheduler appropriate. Currently no doc guidance on this. Add a "before you queue" section to `comfyai/README.md` or a model-specific settings reference.
- ⬜ **KB: model generation awareness** — Agent had no basis for proactively flagging model quality issues (SD1.5 vs SDXL vs Flux, age of model, typical use cases). Need knowledge base content: model families, typical quality tiers, recommended settings per family.

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
