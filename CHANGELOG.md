# Change Log

All notable changes to the "VS Code ComfyUI" extension will be documented in this file.

## [2.2.0] - 2026-04-15

### Agent wiki system — persistent workspace and knowledge contributions

Added a full wiki system for agents to take notes, document cross-workflow learnings, and contribute upstream improvements to the knowledge base.

- **Agent workspace (`wiki/`)** — seeded once on extension activation, preserved across updates. Contains:
  - `wiki/index.md` — agent's running notebook (user preferences, cross-workflow observations, active goals). Now reads `wiki/quick-ref.md` first; includes knowledge/wiki boundary clarification.
  - `wiki/quick-ref.md` — single-file workflow selection decision tree + session start checklist + common patterns links.
  - `wiki/contributions/` — proposed knowledge additions with structured headers
  - `wiki/sessions/` — per-session notes
  - `wiki/scratch/` — temporary notes during tasks, now includes `template-session-log.md` and `template-finding.md`.
  - `wiki/state/` — machine-readable JSON state (`user-preferences.json`).
  - `wiki/patterns/` — documented node combinations (stub files for `lighting-portraits.md`, `quick-to-quality.md`, `image-to-image-flows.md`).
- **Write permissions clarified** — agents can write to `wiki/`, `apply-trigger.json`, and any named patch file. All other files are read-only (extension writes them).
- **Knowledge contribution workflow** — agents write contributions with a header (`target`, `type`, `confidence`, `tested`, `source`, `author`), then run **ComfyUI: Submit Knowledge Contributions** to open GitHub issues directly from the workspace.
- **Contribution commands**: `ComfyUI: List Knowledge Contributions`, `ComfyUI: Submit Knowledge Contributions`, `ComfyUI: View Contribution Preview`, `ComfyUI: Archive Merged Contribution`, `ComfyUI: Discard Contribution`.

### Knowledge base reorganization — restructured for agent navigation

Reorganized `comfyui/knowledge/` into purpose-driven subdirectories that match how agents navigate:

```
knowledge/
  index.md              ← router (unchanged)
  techniques/           ← how to do things: img2img, inpainting, hires-fix, controlnet
  guidance/             ← settings: samplers, resolution, prompting, loras, loras-stacking
  workflow/             ← structure: core-pipeline, workflow-design, workflow-patterns
  reference/            ← lookup: apply-trigger-reference, troubleshooting, node-anatomy
  hardware/             ← hardware-specific: apple-silicon.md (grows to nvidia/amd/drivers)
  models/               ← model-specific patterns (unchanged)
  hiddenswitch/         ← moved from top level
  schemas/              ← moved from top level
```

- **`hiddenswitch/`** moved into `knowledge/hiddenswitch/` — it's knowledge about silent execution, not a separate tool directory
- **`patch-reference.md`** and **`troubleshooting.md`** moved to `knowledge/reference/`
- **`schemas/`** moved to `knowledge/schemas/`
- **`apple-silicon.md`** moved to new `knowledge/hardware/` directory — ready for nvidia, amd, CUDA/ROCm/MPS docs
- Updated all cross-references across 11+ capability files and index files

### Bug fixes

- **Black screen with local stock ComfyUI** — VS Code's webview sends a `vscode-webview://` origin header that stock ComfyUI rejects with 403. Fixed in two ways: (1) the panel now shows an actionable error message with the fix instead of a silent black screen; (2) added documentation and README note. The fix for users: add `--enable-cors-header` to ComfyUI startup args. The hiddenswitch fork permits this origin automatically.
- **Webview Content Security Policy** — added a proper `<meta http-equiv="Content-Security-Policy">` with a per-render nonce to the panel HTML. Without it, VS Code 1.96+ may block the inline relay script and the iframe. The CSP now explicitly allows `frame-src` and `connect-src` for the configured `serverUrl` origin.
- **Windows install line continuations** — the PowerShell install commands used `\` as a line-continuation character (bash syntax). PowerShell uses `` ` `` — the `\` was treated as a command and threw `CommandNotFoundException`. Fixed by removing the unnecessary continuations and joining with `;` on a single line. Affects both Standard and Development install commands.

### New commands

- **ComfyUI: Install Integration Node to External ComfyUI...** — opens a folder picker to select any ComfyUI's `custom_nodes/` directory and installs the VS Code bridge node there. Previously the only install path wrote to the extension-managed hiddenswitch workspace. This command is the intended path for stock ComfyUI users who run their own instance.



### Node catalog — expanded model and metadata coverage

- Expanded **`available-models.json`** model loader map from 8 categories to 30+. Previously only tracked core ComfyUI loaders (checkpoints, VAE, LoRA, ControlNet, upscale, clip_vision). Now includes: `diffusion_models` (UNETLoader), `clip` (CLIPLoader), `style_models`, `gligen`, and all major custom node categories — IPAdapter, DepthAnything, SAM, YOLO/Ultralytics, WanVideoWrapper (MMAudio/Whisper/Wav2Vec2), SeedVR2, ViTPose/pose detection, ComfyUI-Frame-Interpolation (VFI), FlashVSR, kohya diff ControlNet, and LTX latent upscalers. Custom node entries are silently skipped if the node is not installed.
- Added **`comfyai/nodes/display-name-index.json`**: bidirectional map between UI display labels and class type names — only entries where they differ. Agents use `displayToClass` when a UI label appears in conversation and they need the type name for a patch, and `classToDisplay` to show users the label they see. Written on every catalog refresh.
- Added **`comfyai/nodes/output-slot-index.json`**: slot array for every node's outputs, in slot order. Each entry: `{name, type}`. Index = slot number for GraphBuilder `.out(N)` and patch link `src_slot` values. No more guessing from names alone.
- Added **`comfyai/nodes/widget-enums.json`**: valid string values for every COMBO (enum) widget input, excluding model file lists (those are already in `available-models.json`). Covers sampler names, schedulers, upscale methods, and any other string-enum input. Preferred lookup before falling back to `node-registry.json`.

### Agent trigger commands — new built-in operations

- Added **`{"command": "restart-server", "ts": n}`** trigger: hits the configured `restartEndpoint`, waits (up to `serverTimeout` ms) for the server to become responsive, reloads the panel, and refreshes the node catalog. Blocking — `apply-response.json` is written only after the server is back. Works with remote servers via `comfyui.serverUrl` setting.
- Added **`{"command": "refresh-catalog", "ts": n}`** trigger: re-fetches `/object_info` and rebuilds all catalog files without a server restart. The programmatic equivalent of the "ComfyUI: Refresh Node Catalog" command palette entry. Use after installing a custom node to pick up its new node types immediately. Reports added/removed node counts in the response.
- Added **`{"command": "open-panel", "ts": n}`** trigger: creates or reloads the ComfyUI panel in VS Code. Useful after a server restart if the panel did not reload automatically.
- **Apply trigger renamed** — `apply-patch-trigger.json` → `apply-trigger.json` (and matching doc/schema rename) to reflect that the file handles commands far beyond patching.
- **`notes` field for action logging** — optional `notes` field in `apply-trigger.json` (e.g., `"notes": "testing prompt variation A"`). Echoed back in `apply-response.json` and logged to `workflow-history/` for audit trail. All commands now write history entries with notes.
- **`analyze-workflow` command** — new trigger command to analyze a workflow JSON file without loading it into the panel. Takes `workflowPath` and `outputFile` fields. Writes the same analysis format as `workflow-summary.md` to a specified output path. Useful for analyzing saved templates or user-shared workflows.

### Model curation — agent-editable config

- Added **`comfyai/hiddenswitch/config/model-includes.json`**: agents and users add HuggingFace or CivitAI model entries here. The bridge Python init reads this file at server startup and registers models via `add_known_models`. The server auto-downloads on first workflow use. Supports both `"source": "hf"` (HuggingFile) and `"source": "civitai"` (CivitFile) entries with full field documentation in the file itself.
- Added **`comfyai/hiddenswitch/config/model-veto.json`**: agents and users list model filenames here to remove them from the server's known-model list at startup. Useful to suppress default models that are unavailable, renamed, or unwanted.
- Both files are **seeded once** from `tools/model-{includes,veto}-template.json` on first extension activation and never overwritten — user and agent edits survive extension updates.
- The Python `__init__.py` bridge node was rewritten to implement the curation logic: reads both config files at startup, calls `add_known_models` for includes, filters `_known_models_db` for vetos. Gracefully skips entries with missing fields or unknown sources.

### Agent documentation — knowledge base (committed: knowledge base first pass)

Added a comprehensive `comfyai/knowledge/` reference library covering the concepts agents need to build and debug workflows correctly:

- **Workflow fundamentals**: `node-anatomy.md` (inputs, outputs, widgets, link types), `core-pipeline-nodes.md` (the 8 nodes in every image workflow), `workflow-design.md` (building from outputs backward)
- **Sampling**: `samplers.md` (KSampler vs KSamplerAdvanced, denoise, CFG mechanics, scheduler comparison)
- **Prompting**: `prompting.md` (tag-based vs natural language, attention syntax, negative prompts, model-specific notes)
- **Resolution and aspect ratio**: `resolution.md` (native resolutions by family, standard dimensions table, hires fix threshold)
- **LoRAs**: `loras.md` (how LoRAs work, strength, model-only vs full), `loras-stacking.md` (stacking limits, interaction effects)
- **Common workflow patterns**: `img2img.md` (VAEEncode → KSampler denoise), `inpainting.md` (mask pipeline, hard vs soft inpaint), `hires-fix.md` (latent upscale → re-sample pattern)
- **ControlNet usage**: `controlnet.md` (apply nodes, preprocessors, strength/start/end timing, stacking)
- **Hardware**: `apple-silicon.md` (MPS device, `--novram` flag, VAE precision issues)
- **Node development**: `hiddenswitch/node-development/best-practices.md` (do-less-per-node, avoid side effects, lazy evaluation)
- **Index and router**: `knowledge/README.md` + `knowledge/index.md` routing agents to the right file

### Agent documentation — model knowledge restructuring

Restructured `comfyai/knowledge/models/` to eliminate cross-family contamination — agents no longer load SD1.5 or SDXL-specific content when working with Flux (or vice versa):

- **Split `sdxl.md`** into two separate files: `sd15.md` (SD 1.5 — 512×512 architecture, single CLIP, tag prompts) and `sdxl.md` (SDXL — dual CLIP, 1024×1024, refiner). Each file is now fully self-contained with its own VAE, sampler settings, IP-Adapter models, and ControlNet model sections.
- **Added `pony.md`** (Pony Diffusion V6 XL — score tag system, e621/Danbooru training) and **`illustrious.md`** (Illustrious XL / NoobAI-XL — Danbooru tags) as separate stubs linked from `sdxl.md`. Both are SDXL-architecture but have distinct prompting conventions.
- **`loading-patterns.md`**: removed the "Sampler settings by model family" table — each family file now owns its own sampler settings. The loader node table (category → loader node) remains as it is genuinely agnostic.
- **`ipadapter.md`** and **`controlnets.md`**: thinned to concept + task-routing tables. All per-family model lists moved into the family files (`sd15.md`, `sdxl.md`, `flux.md`).
- **`upscalers.md`**: latent upscalers section removed (family-specific); replaced with routing links to `ltx.md` and `hunyuan.md`. Pixel upscalers (RealESRGAN), SeedVR2, FlashVSR, and VFI content unchanged.
- **`vae.md`**: per-family VAE section replaced with a routing table pointing to each family file. Symptoms, precision/hardware notes, and common-mistakes content unchanged. Each family file now has its own `## VAE` section.
- **`flux.md`**: added `## VAE` section (ae.safetensors, AIO vs diffusion-only distinction), `## ControlNet models` section (FLUX ControlNet LoRAs — load with LoraLoader, not ControlNetLoader); expanded sampler table to include CFG column.
- **`ltx.md`**: latent upscaler models now inline with loader note (was a bare pointer to `upscalers.md`).
- **`hunyuan.md`**: added `## Latent upscaler` section inline.
- **README.md**: routing table updated — separate rows for SD1.5, SDXL, Pony XL, Illustrious XL.

### Agent documentation — catalog lookup improvements

- Updated **`graphbuilder.md`**: added practical patterns for looking up output slot indices from `output-slot-index.json`, looking up valid COMBO values from `widget-enums.json`, and validating connection types before building. Simplified open questions about GUI loading into a focused stub.
- Updated **`hiddenswitch/reference/models.md`**: added CivitAI `CivitFile` usage docs (constructor args, how to find model/version IDs from URLs, auth limitations, gated model workaround via manual download); added `model-veto.json` docs; restructured "adding models to the panel" section into Option A (model-includes.json) vs Option B (manual download) with clearer guidance.
- Updated **`nodes/README.md`**: added Step 2.5 quick-lookup entry (display-name-index, output-slot-index, widget-enums — check these before opening `node-registry.json`); added connection compatibility cross-reference.
- Updated **`patch-reference.md`**: added `restart-server`, `refresh-catalog`, and `open-panel` commands to the trigger table; added guidance on when to use restart-server vs refresh-catalog; noted that `restart-server` is blocking and includes a catalog refresh.

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
