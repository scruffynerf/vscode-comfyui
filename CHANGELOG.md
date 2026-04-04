# Change Log

All notable changes to the "VS Code ComfyUI" extension will be documented in this file.

## [2.1.0] - 2026-04-04

### Agent protocol — core mechanism fixes

- Fixed **patch mechanism** (`patchBridge.ts`, bridge JS): patches were never applied to the live workflow. Root cause: bridge JS only handled `updateComfyState` (which called `loadGraphData` unconditionally). Rewrote: patch mode sends `applyPatch` which updates nodes in-place via LiteGraph API (`graph.getNodeById`, `node.pos`, `node.widgets_values`, `LiteGraph.createNode`, `graph.add`, `node.connect`). Full workflow mode (`sourcePath`) still uses `loadGraphData` intentionally.
- Fixed **new tab on every patch**: `loadGraphData` always calls `useWorkflowService().beforeLoadNewGraph()` → `createNewTemporary()` → new tab. Fix: `applyPatch` bypasses `loadGraphData` entirely, operating on `app.graph` in place.
- Fixed **queue command not wired**: bridge JS had no handler for `queueWorkflow`. Added handler calling `app.queuePrompt(0, 1)`.
- Fixed **cold-start missed triggers**: on watcher creation, extension now checks if `apply-patch-trigger.json` mtime is newer than `apply-response.json` mtime; if so, processes the trigger immediately. Handles writes that arrived before extension activation.
- Fixed **node/link deletion**: added `remove_nodes` and `remove_links` to `mergeWorkflows` and bridge JS. Removals run before adds/updates, enabling atomic delete-and-replace in a single patch. `app.graph.remove()` disconnects all attached links automatically.
- Fixed **type-change warning for atomic replacements**: the warning about unsupported type changes now correctly skips nodes that are also in `remove_nodes` in the same patch — atomic replacement (remove + re-add with new type, same ID) returns `status: ok`.

### Agent protocol — new commands and fields

- Added **`apply-response.json`**: written after every trigger. Schema: `{status, ts, message, trigger_ts}`. Agents read it to confirm success or get an error reason. `trigger_ts` echoes the `ts` from the trigger for correlation.
- Added **`{"command": "auto-layout", "ts": n}`**: calls `app.graph.arrange()` + `setDirtyCanvas`. Caveat: groups are not repositioned.
- Added **`{"command": "interrupt", "ts": n}`**: POSTs to `/interrupt`. No bridge node required.
- Added **`{"command": "queue", "count": N, "ts": n}`**: optional `count` field queues N runs in one trigger. Defaults to 1. Useful when seed is set to "randomize" for variation runs.
- Added **`{"command": "queue-status", "ts": n}`**: queries `/queue` endpoint and returns running count, pending count, and currently-running `prompt_id` in `apply-response.json`. Use before queueing more runs or to correlate outputs.
- Added **`{"command": "testing-mode", "logPath": "feedback/testN", "ts": n}`**: enables per-action testing reminders. Each subsequent `apply-response.json` includes `log_file` (a new per-action path keyed to `trigger_ts`) and `testing_reminder`. Disable with `{"command": "testing-mode", "enabled": false, "ts": n}`.
- Added **JSON Schema for patch and apply files**: formal schemas for `workflow-patch.schema.json` and `apply-patch-trigger.schema.json`, wired via `jsonValidation` in `package.json`. VS Code validates and autocompletes agent-written files.

### Agent visibility — state and metadata files

- Added **`comfyai/available-models.json`**: written during node catalog build. Extracts COMBO inputs from all known loader nodes (CheckpointLoaderSimple, VAELoader, LoraLoader, ControlNetLoader, etc.). Agents use exact strings from this file when referencing models in patches.
- Added **`comfyai/server-info.json`**: written on panel open via `/system_stats`. Schema: `{serverUrl, configuredStartupArgs, system, devices, updatedAt}`. Agents use this to understand device, VRAM, and launch flags before making performance judgements.
- Added **`comfyai/_extension/catalog-refresh-timestamp.json`**: written at the end of every catalog build (`{completedAt, nodeCount}`). Agents compare `completedAt` against their action time to confirm a refresh has finished before querying `node-registry.json`.
- Added **Atomic state writes**: both `comfyai/workflow-state.readonly.json` and `comfyai/workflow-summary.md` are now written via write-to-temp / rename, so agents never read a partial file mid-write.
- Added **Agent patch history**: every applied patch is saved to `comfyai/workflow-history/<timestamp>.json` with `snapshotBefore` (full state prior to patch) and the raw patch. Revert by loading `snapshotBefore` via `sourcePath`.

### Agent visibility — workflow summary

- Added **`comfyai/workflow-summary.md`**: written on every state change alongside `workflow-state.readonly.json`. Human/AI-readable breakdown: pipeline shape, sources, sinks, current node values, hints for common tasks.
- Added **Workflow summary — operation class labels**: nodes classified by functional class (Source, Transform, Convert, Combine, Split, Sampler, Sink, Control, Variable, Misc) using type-signature inference — no name-pattern matching. Pipeline trace labels each node with its class.
- Fixed **workflow-summary.md — KSamplerAdvanced fields**: after a KSampler → KSamplerAdvanced replacement, the summary previously omitted `add_noise`, `start_at_step`, `end_at_step`, and `return_with_leftover_noise`. All 10 fields now included. Fix is in `tools/node-data.json` (shared by TypeScript and Python consumers).

### Node catalog

- Added **Node Catalog** (`nodeCatalog.ts`): `ComfyUI: Refresh Node Catalog` command (and silent best-effort on panel open) fetches `/object_info`, classifies every node by functional operation class, and writes a three-tier set of files: `comfyai/nodes/classes/index.md`, per-class `.md` files, and `comfyai/nodes/node-registry.json`. Incremental: diffs against a manifest and only rebuilds on change.
- Added **Capability index** (`comfyai/nodes/capability/index.md` + `capability/<slug>.md`): agents find custom node packs by task — 18 buckets (Text/Prompts, Masks, ControlNet, Video, Audio, LLM, etc.). Each bucket file lists matching packs with specific node class names, install status, and links. Router is a small table; detail files are loaded on demand.
- Added **`comfyai/nodes/registry-search.json`** and **`comfyai/nodes/node-class-search.json`**: pre-generated local search indexes (~2600 and ~1700 packs respectively). Agents can keyword-search the broader ecosystem without network calls.
- Added **`comfyai/nodes/appmana-catalog.json`**: local copy of the full 2559-package appmana wheel index. Agents search by keyword without a network call.
- Added **`tools/rebuild-docs.sh`**: single command to regenerate all auto-generated agent docs. Add `--refresh` to re-fetch from the Comfy Registry API.
- Extended **operation class taxonomy** from 8 to 10 classes: added `Variable` (primitive-output nodes + SetNode/GetNode) and `Misc` (ambiguous type signatures). Classification priority: Sampler → SetNode/GetNode → Sink → Variable → Control → Source → Transform → Combine/Split → Convert → Misc.

### Server / extension lifecycle

- Fixed **server restart now auto-refreshes node catalog**: `restartServer` command now calls `ComfyUIPanel.triggerCatalogUpdate()` after the server becomes responsive. Agents no longer need a separate manual refresh step after restart.
- Added **`comfyui.enableAiFeatures` setting** (default: `true`): when `false`, all AI agent integration is disabled — no state file writes, no workflow summary, no node catalog, no apply-patch watcher, no agent doc deployment. Extension functions as a plain embedded ComfyUI panel.

### Documentation improvements

- Rewrote **`comfyai/patch-reference.md`** as a dedicated reference doc (moved out of `comfyai/README.md`): full patch protocol, trigger format, all commands, widget array layouts for KSampler and KSamplerAdvanced (including `control_after_generate` hidden entry), link slots vs widget position table, node type replacement recipe.
- Added **queue fire-and-forget guidance**: queue triggers are not acknowledgement-based — multiple can be written in rapid succession. Patches and queue triggers can be freely interleaved (queue, patch seed, queue, patch seed, queue) without waiting for any prior run to finish.
- Added **batch patch guidance**: multiple unrelated node changes should go in one patch (`nodes` is an array). Only split into separate patches when a later change depends on the result of an earlier one.
- Added **link ID reuse note**: after `remove_nodes`, old link IDs are freed and can be safely reused when reconnecting the replacement node.
- Added **COMBO value guidance**: COMBO widget values are always strings — never `true`/`false` or `1`/`0`. Lookup path: `node-registry.json input.required.<field>[0]`.
- Added **node-registry.json null field guidance** (`nodes/README.md`): `display_name`, `description`, `category` may be explicitly null — use `or ''` not just a default. `input.required` values are `[type_string]` lists, not dicts.
- Added **hiddenswitch CLI output directory note** (`hiddenswitch/run-workflow.md`): CLI writes to `<cwd>/output/`, not `comfyui-workspace/output/`. Run from inside `comfyui-workspace/` or pass `--output-dir` explicitly.
- Added **model availability section** (`hiddenswitch/reference/models.md`): how to check if a model is already on disk (check `models/` subdirs, use `huggingface-cli scan-cache`), and how to estimate download size from HF metadata before committing to a download.
- Added **`comfyai/README.md` — mode routing**: explicit third case — "queue/run the workflow currently in the panel → GUI bridge queue command, not hiddenswitch." Added post-queue diagnostic sequence, `widgets_values` completeness requirement, and `available-models.json` caveat.
- Added **`COMFYUI_AGENT_GUIDE.md` — entry point gate**: "Read this for orientation, then stop and ask the user what they want before reading anything else."
- Added **`COMFYUI_AGENT_GUIDE.md` — directory notes**: venv/ (don't glob broadly), models/ (use `available-models.json`), `custom_nodes/vscode-comfyui-integration/` (extension bridge, do not modify).
- Added **`TESTING-AGENT-INSTRUCTIONS.md` — path base clarification**: all `comfyai/` paths are relative to the directory containing `COMFYUI_AGENT_GUIDE.md`, not the VS Code workspace root.
- Added **`hiddenswitch/run-workflow.md` — reliability ranking**: table of all three execution paths (CLI, embedded Python, remote client) with known failure modes. macOS `if __name__ == '__main__':` guard requirement. Remote client: API-format requirement and 0-byte silent failure pattern.
- Added **`hiddenswitch/install-custom-nodes.md`**: UV install patterns, appmana catalog usage, git-only fallback, CUDA variant selection, post-install server restart.
- Added **`nodes/find-a-node.md`**: 4-step discovery hierarchy — installed nodes → capability index / appmana catalog → registry-search + node-class-search → write from scratch.
- Added **troubleshooting, interrupt, slow generation, log guidance**: `troubleshooting.md` now covers execution interrupted vs crash, Apple Silicon `--novram` performance context, `tail -20` log guidance, and `/history` polling.

## [2.0.0] - 2026-03-27

- Forked from [piiq/code-comfyui](https://github.com/piiq/code-comfyui) by [scruffynerf](https://github.com/scruffynerf).
- Added Support for remote ComfyUI instances via `comfyui.serverUrl` setting.
- Consolidated `Open` and `Reload` commands into a single `ComfyUI: Open/Reload ComfyUI Editor` command.
- Updated keybinding to `Ctrl+Shift+R` to avoid conflicts with macOS system shortcuts.
- Added `ComfyUI: Restart Server` command with configurable endpoint and `Ctrl+Shift+Alt+R` shortcut.
- Fixed `ComfyUI: Restart Server` throwing a false 'fetch failed' error when the server drops the connection during reboot (the extension now waits 5 seconds and automatically reloads the panel).
- Added `ComfyUI: Install Hiddenswitch ComfyUI` (Standard) using `uv`.
- Added `ComfyUI: Install Development ComfyUI` (Git Clone) with editable install support.
- Added `comfyui.installDir` configuration setting to customize installation path.
- Enhanced `ComfyUI: Run Hiddenswitch ComfyUI` to automatically open the editor panel after server startup.
- Brand new icon featuring the Flying Spaghetti Monster.

## [1.0.1] - 2024-01-05

### Added-1.0.1

- Extension icon
- Link to install from VS Code Marketplace

## [1.0.0] - 2024-01-05

### Added-1.0.0

- Initial release of VS Code ComfyUI
- Embed ComfyUI interface directly in your code editor
- Command palette integration with "Open ComfyUI Editor" command
- Support for clipboard operations
- Persistent session state
- Native editor integration
