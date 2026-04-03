# Change Log

All notable changes to the "VS Code ComfyUI" extension will be documented in this file.

## [Unreleased]

> **Note**: 2.1.0 has not been released yet. All items in this [Unreleased] section and the [2.1.0] section below will be combined into the final 2.1.0 release notes.

### Agent protocol — apply/patch/response improvements

- Fixed **patch mechanism** (`patchBridge.ts`, bridge JS): patches were never applied to the live workflow. Root cause: bridge JS only handled `updateComfyState` which called `loadGraphData` unconditionally. Rewrote: patch mode sends `applyPatch` which uses LiteGraph API directly (`graph.getNodeById`, `node.pos`, `node.widgets_values`, `LiteGraph.createNode`, `graph.add`, `node.connect`). Full workflow mode (`sourcePath`) still uses `loadGraphData` intentionally.
- Fixed **new tab on every patch**: `loadGraphData` always calls `useWorkflowService().beforeLoadNewGraph()` → `createNewTemporary()` → new tab. Fix: `applyPatch` bypasses `loadGraphData` entirely, operating on `app.graph` in place.
- Fixed **queue command not wired**: bridge JS had no handler for `queueWorkflow`. Added handler calling `app.queuePrompt(0, 1)`.
- Fixed **cold-start missed triggers**: on watcher creation, extension now checks if `apply-patch-trigger.json` mtime is newer than `apply-response.json` mtime; if so, processes the trigger immediately. Handles writes that arrived before extension activation.
- Added **`apply-response.json`**: extension writes this file after every trigger (patch, sourcePath, queue, interrupt, auto-layout, testing-mode). Schema: `{status, ts, message}`. Agents read it to confirm success or get an error reason.
- Added **`{"command": "auto-layout", "ts": n}`** trigger: calls `app.graph.arrange()` + `setDirtyCanvas`. Documented caveat: groups are not repositioned.
- Added **`trigger_ts` field** to `apply-response.json`: echoes the `ts` value from the trigger that caused the response, so agents can match responses to specific trigger writes.
- Added **`{"command": "testing-mode", "logPath": "feedback/testN", "ts": n}`** trigger: enables per-action testing reminders. Each subsequent `apply-response.json` includes `log_file` (a new per-action path keyed to `trigger_ts`, e.g. `feedback/testN/log-1005.md`) and `testing_reminder` prompting comprehensive logging of everything since the last entry. Disable with `{"command": "testing-mode", "enabled": false, "ts": n}`. Session log entries are new files — agents use Write with no prior read needed.

### Agent visibility improvements

- Added **`comfyai/apply-response.json`** routing clarification in docs: `comfyai/README.md` mode-selection now has an explicit third case ("queue/run the workflow currently in the panel → GUI bridge queue command, not hiddenswitch").
- Added **`comfyai/available-models.json`**: written during node catalog build. Extracts COMBO inputs from all known loader nodes (CheckpointLoaderSimple, VAELoader, LoraLoader, ControlNetLoader, etc.). Agents use exact strings from this file when referencing models in patches.
- Added **`comfyai/server-info.json`**: written on panel open via `/system_stats`. Schema: `{serverUrl, configuredStartupArgs, system, devices, updatedAt}`. Agents use this to understand device, VRAM, and launch flags (e.g. `--novram`) before making performance judgements.
- Added **`comfyai/_extension/catalog-refresh-timestamp.json`**: written at the end of every catalog build (`{completedAt, nodeCount}`). Agents compare `completedAt` against their action time to confirm a refresh has finished before querying `node-registry.json`.

### Server / extension lifecycle fixes

- Fixed **server restart now auto-refreshes node catalog**: `restartServer` command waited for the server to become responsive then called `openReloadEditor`, but never refreshed the catalog. Added `ComfyUIPanel.triggerCatalogUpdate()` in both `becameResponsive` branches. Agents no longer need a separate manual refresh step after restart.

### Documentation improvements

- Added **routing clarity**: hiddenswitch `README.md` gate updated with explicit example — "run the workflow" = GUI bridge `queue` command when the user wants to see it in the panel.
- Added **`run-workflow.md` reliability ranking**: table of all three execution paths (CLI, embedded Python, remote client) with known failure modes. CLI listed first as most reliable. Added macOS `if __name__ == '__main__':` guard requirement to embedded Python example. Remote client: documented API-format requirement and 0-byte silent failure pattern.
- Added **`comfyai/README.md` — timestamp guidance**: clarified that any incrementing integer works; `Date.now()/1000` was JS-only advice, not a requirement. AI agents without clock access can use a counter.
- Added **`comfyai/README.md` — partial node update example**: explicit example showing `id` + `pos` only is valid — unspecified fields are preserved.
- Added **`comfyai/README.md` — empty workflow guidance**: zero-node state is normal on fresh install; what to do (wait for user to load a workflow, or start adding nodes).
- Added **`comfyai/README.md` — debugging section**: `user/comfyui.log` location, `tail -20` guidance, and what each log pattern means (`Failed to validate prompt`, `HTTP Request:`, `Prompt executed in X seconds`, etc.).
- Added **`comfyai/README.md` — sync model**: documented one-direction automatic sync (panel → file), patch flow, and "never write `workflow-state.readonly.json` directly."
- Added **`comfyai/README.md` — workflow-summary staleness warning**: cached in-context copies go stale after patches; always re-read the file for current state. Both `workflow-state.readonly.json` and `workflow-summary.md` update automatically after patches apply.
- Added **`comfyai/README.md` — link ID reassignment**: link IDs in patches are ignored; extension assigns its own using `last_link_id`. Re-read state to get actual IDs after adding links.
- Added **`comfyai/README.md` — links dropped on type correction**: correcting a node's `type` in a patch may drop existing links. Verify links after any type change and add a second patch to reconnect if needed.
- Added **`comfyai/README.md` — `/history` polling after queue**: queue response now includes reminder to poll `GET http://localhost:8188/history`. Added full curl + Python one-liner to `troubleshooting.md` for checking execution status.
- Added **`hiddenswitch/reference/models.md` — `add_known_models()` scope**: clarified that it registers for the embedded client only — does NOT download immediately, not visible to server/CLI/panel.
- Added **`hiddenswitch/install-custom-nodes.md` — post-install steps**: server restart now auto-refreshes catalog (single step). Added `--python {venv}/bin/python` flag for non-`.venv` venv names. Added appmana index fallback to git clone. Added note for pre-existing clone (skip `git clone`, go straight to requirements install).
- Added **`nodes/README.md` — registered type name warning**: Python class name may differ from registered type (e.g. `RemBGSession` vs `RemBGSession+`). Always verify the exact key in `node-registry.json` after catalog refresh before using a type in a patch.
- Added **`nodes/README.md` — catalog refresh completion**: how to read `catalog-refresh-timestamp.json` to confirm refresh is done.
- Added **`nodes/find-a-node.md`** — post-install instruction now consistent: restart server (catalog auto-refreshes).
- Added **`troubleshooting.md` — execution interrupted**: distinguishes user-stop (`execution_interrupted`) from crash (`execution_error`). Do not re-queue after an interrupt without asking the user.
- Added **`troubleshooting.md` — slow generation on Apple Silicon**: `--novram` is the recommended default on M-series, not a degraded mode. Typical step times. How to check `server-info.json` and step count.
- Added **`troubleshooting.md` — server log `tail` guidance**: log grows over time; use `tail -20`, not a full read.
- Added **`COMFYUI_AGENT_GUIDE.md` — entry point gate**: "Read this for orientation, then stop and ask the user what they want before reading anything else." Prevents agents from pre-reading all docs before receiving a task.
- Added **`COMFYUI_AGENT_GUIDE.md` — directory notes**: venv/ (don't glob broadly, use `pip list`), models/ (use `available-models.json`, not directory listings), `custom_nodes/vscode-comfyui-integration/` (extension bridge, do not modify).
- Added **`nodes/README.md` — node-registry.json size estimate**: `~1.8 MB / ~450k tokens` added to the "do not read the whole file" warning.



- Added **Capability index** (`comfyai/nodes/capability-index.md` + `capability/<slug>.md`): agents can find custom node packs by what they do — 19 task buckets (Text/Prompts, Masks, ControlNet, Video, Audio, LLM, etc.) plus a utility catch-all. Each bucket file lists matching packs with the specific node class names that triggered the match, count hints, appmana install status, and inline git-only links. Router is a small table; detail files are loaded on demand to minimise token cost.
- Updated **`comfyai/nodes/find-a-node.md`** Step 2: now leads with the capability index rather than a raw appmana JSON search script.
- Added **`comfyai/nodes/find-a-node.md` Step 3 — local search fallbacks**: Step 3A searches `registry-search.json` (655 KB, ~2600 active packs) by keyword against id/name/description; Step 3C searches `node-class-index.json` (540 KB, ~1700 packs) by node class name substring; Step 3B surfaces comfyregistry.org for browser search as a last resort.
- Added **`comfyai/nodes/registry-search.json`** and **`comfyai/nodes/node-class-index.json`**: pre-generated search indexes deployed alongside the node catalog. Generated by `tools/generate_search_indexes.py`, included in `tools/rebuild-docs.sh`.
- Added **`tools/rebuild-docs.sh`**: single command to regenerate all auto-generated agent docs (`bash tools/rebuild-docs.sh`; add `--refresh` to re-fetch from the Comfy Registry API).
- Added **`tools/node-name-transforms.json`**: per-pack `strip_prefix` and `strip_suffix` rules applied when rendering capability index entries, removing redundant pack-name prefixes (e.g. `Basic data handling: `, `VHS_`) and author attribution suffixes (e.g. `|pysssss`, ` [DVB]`).
- Added **appmana pip catalog** (`comfyai/nodes/appmana-catalog.json`): a local copy of the full 2559-package appmana wheel index, deployed alongside the node registry. Agents can search it by keyword without a network call. See `comfyai/nodes/find-a-node.md` Step 2.
- Added **`comfyai/hiddenswitch/install-custom-nodes.md`**: agent task doc for installing custom nodes via the appmana catalog or git. Includes the UV safety note — always use `uv pip`, not plain `pip`, with `--extra-index-url` (plain pip has an unresolved package squatting vulnerability with extra indexes; UV resolves priority correctly). Documents CUDA variant selection (`/simple/cu128` for CUDA 12.8 builds).
- Fixed **false gate in `node-development/README.md`**: finding a node close enough to fork now correctly routes *into* node development rather than blocking it.
- Added **`comfyui.enableAiFeatures` setting** (default: `true`): when set to `false`, all AI agent integration is disabled — no state file writes, no workflow summary, no node catalog, no apply-patch watcher, no agent doc deployment. The extension functions as a plain embedded ComfyUI panel with no file-system side effects.
- Added **Execution API via apply file**: `comfyai/apply-patch-trigger.json` now supports two server commands. `{"command": "interrupt"}` POSTs to `/interrupt` directly — no bridge node required, just a running server. `{"command": "queue"}` forwards to the ComfyUI frontend via postMessage — requires the bridge custom node, which handles it via `app.queuePrompt()`. Agents can trigger and stop generation without knowing the server URL. The schema already included these commands; this wires up the implementation.
- Fixed **`comfyui.applyWorkflow` command**: documented that it requires the bridge custom node to be installed (it sends a message to the ComfyUI iframe, which the bridge node's JS handles).
- Extended **operation class taxonomy** from 8 to 10 classes: added **Variable** (nodes that output only primitive/non-pipeline types — INT, FLOAT, STRING, BOOLEAN, COMBO — plus SetNode/GetNode) and **Misc** (fallback for nodes whose type signatures are ambiguous or use unusual custom types). Classification priority order is now: Sampler → SetNode/GetNode → Sink → Variable → Control → Source → Transform → Combine/Split → Convert → Misc. Both the node catalog and workflow analyzer use the same 10 classes.

## [2.1.0] - 2026-03-31

- Added **JSON Schema for patch and apply files**: Formal schemas for the patch payload format (`workflow-patch.schema.json`) and the apply-patch trigger format (`apply-patch-trigger.schema.json`), wired via `jsonValidation` in `package.json`. VS Code validates and autocompletes agent-written files. Apply schema pre-includes the `command` field for forward compatibility.
- Added **Atomic state writes**: Both `comfyai/workflow-state.readonly.json` and `comfyai/workflow-summary.md` are now written via write-to-temp / rename, so agents never read a partial file mid-write.
- Added **Agent patch history**: Every applied patch is saved to `comfyai/workflow-history/<timestamp>.json` with `snapshotBefore` (the full state prior to the patch) and the raw patch. To revert: load `snapshotBefore` from the most recent history entry via `sourcePath`.
- Added **Node Catalog** (`nodeCatalog.ts`): `ComfyUI: Refresh Node Catalog` command (and silent best-effort on panel open) fetches `/object_info`, classifies every node by functional operation class using type-signature inference, and writes a three-tier set of files: `comfyai/nodes/index.md` (class overview), `comfyai/nodes/<class>.md` (per-class node lists), `comfyai/nodes/node-registry.json` (raw dump). Incremental: diffs against a manifest and only rebuilds on change.
- Updated **Workflow Summary** (`workflowAnalyzer.ts`): Nodes are now classified by functional operation class (Source, Transform, Convert, Combine, Split, Sampler, Sink, Control) using type-signature inference — same rules as the catalog, no name-pattern matching. Summary restructured: pipeline shape line at top, Sources show what types they provide, Sinks show what they consume, pipeline trace labels each node with its class, Hints derived from type signatures (catches any text encoder, not just CLIPTextEncode by name).
- Added **Workflow Summary** (`workflowAnalyzer.ts`): on every state change, `comfyai/workflow-summary.md` is written alongside `comfyai/workflow-state.readonly.json` with a human/AI-readable breakdown of inputs, outputs, model loaders, main pipeline, variables, loops, sections, current node values, and hints for common tasks. Agents should read this before the raw JSON.
- Added **Status Bar indicator**: a persistent "ComfyUI" item in the status bar shows the extension is active and updates to reflect patching, analysis, and catalog activity.
- Added `comfyui.installUvAutomatically`, `comfyui.venvDir`, `comfyui.startupArgs`, and `comfyui.pythonVersion` settings to README documentation.
- Added Commands table and full Configuration table to README.
- Refactored `src/extension.ts` into focused modules: `panel.ts`, `patchBridge.ts`, `agentFiles.ts`, `nodeCatalog.ts`, `workflowAnalyzer.ts`, `install.ts`, `config.ts`, `installDir.ts`, `statusBar.ts`.

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
