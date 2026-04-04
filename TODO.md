# TODO

Open items only. Done items archived in `TODO-DONE-1.md`.

---

## Needs testing

- ⬜ **TEST: patch/trigger end-to-end** — Verify the file watcher in `patchBridge.ts` fires correctly in a fresh install scenario. BUG-1 (bridge JS rewrite) addressed the message-handling side, but was not confirmed whether the watcher itself was also failing. Test with a real agent session from scratch.

- ⬜ **TEST: install command "not empty" fix** — `ensureAgentGuide` runs on activation before the install command, creating `comfyai/` and `COMFYUI_AGENT_GUIDE.md`. Those are now filtered out of the "not empty" check. Verify on a clean workspace (no prior install).

---

## Doc / content (no dev input needed)

- ⬜ **KB: pre-flight checklist** — Agents have no guidance on model-appropriate settings before queueing. Add a "before you queue" section to `comfyai/README.md` or a standalone reference: step count (Flux Schnell → ≤4), CFG (Flux → 1), scheduler choices per model family.

- ⬜ **KB: model generation awareness** — No knowledge base content on model families (SD1.5 vs SDXL vs Flux), typical quality tiers, or recommended settings per family. Agents can't proactively flag mismatches. Add to `knowledge_base.md` or a new `hiddenswitch/reference/model-families.md`.

---

## Needs hiddenswitch dev input (blocked)

- ⬜ **MODEL: model type metadata** — `available-models.json` has no field distinguishing AIO checkpoints from diffusion-only / CLIP-only / VAE-only components. Agents recommend wrong models (e.g. Chroma1-Base, diffusion-only, suggested as a full checkpoint). Options: (a) curated annotation JSON the extension merges in, (b) expose from `/object_info` if the fork adds type info. **Discuss with dev.**

- ⬜ **MODEL: model list completeness / companion files** — Some models (e.g. zimage) appear only as a VAE, not a checkpoint. Agents search, find nothing, go to HuggingFace. Need a way to annotate "this is a component, not an AIO model" or link companion files. **Discuss with dev.**

- ⬜ **MODEL: model size info** — No file sizes in `available-models.json`. Agents can't assess VRAM fit before recommending a model. Source unclear — may require a separate metadata file or curated annotations. **Discuss with dev.**

- ⬜ **MODEL: add_known_models as panel download path** — Hypothesis: `add_known_models` + minimal hiddenswitch workflow triggers HF download and symlinks into `installDir/models/`. Server restart then picks it up. **Confirm with dev**: does embedded client actually create symlinks in `installDir/models/`? If yes, document as the download path. If no, use `hf_hub_download` with `local_dir`.

- ⬜ **FEAT: model refresh command** — Agents must restart the server to pick up newly added models. Stock ComfyUI has a hotkey for model-list refresh without restart. **Discuss with dev**: (a) does the hiddenswitch fork expose a refresh endpoint? (b) difference between model-list refresh vs. hot-reload? Once confirmed, expose via trigger command or document the endpoint.

- ⬜ **FEAT: tab awareness** — Write `comfyai/tabs.json` with active tab index, tab names, and node counts. Blocked: tab state lives in Vue pinia composable (`useWorkflowService().openWorkflows`), not accessible as a plain global from bridge JS. **Discuss with dev**: does the fork expose `app.workflowManager` or equivalent? DOM scraping is the only fallback (fragile).

- ⬜ **GraphBuilder → GUI panel** — `GraphBuilder.finalize()` produces API-format JSON. Can it be loaded into the panel? Does the hiddenswitch fork include ComfyUI PR #1932 (API-format loading)? Does `sourcePath` in the extension bridge accept API format? See open Qs in `hiddenswitch/graphbuilder.md`. Until resolved, GraphBuilder output can only be *run* (hiddenswitch), not *shown* in the panel.

---

## Curation (ongoing)

These files are never "done" — add/refine entries as new nodes/packs are encountered.

- ⬜ `tools/popular-nodes-descriptions.json` — agent-friendly description overrides for top-100 packs
- ⬜ `tools/popular-nodes-veto.json` — mark duplicates and deprecated packs
- ⬜ `tools/popular-nodes-includes.json` — must-include packs that fall below rank 100
- ⬜ `tools/node-name-transforms.json` — prefix/suffix strips for noisy node class names
- ⬜ `knowledge_base.md` — common workflow patterns and usage examples (stub, low priority)

---

## Future / design (no near-term plans)

- ⬜ **Auto node type change** — When a patch specifies a different `type` on an existing node, automatically delete+recreate with link reconnection (checking slot compatibility). Currently unsupported and documented as such — agents use `remove_nodes` + new node explicitly instead. Only worth revisiting if agent sessions consistently struggle with the manual approach.

- ⬜ **Workflow diffing** — Semantic diff between two workflow JSONs: what nodes/links were added, removed, or changed, in human-readable form. Useful for reviewing agent edits and understanding iteration history.

---

## Won't fix / upstream

- ⬜ **HSVThresholdMask 3D tensor mismatch** — `comfyui-post-processing-nodes` mislabels output as IMAGE (4D) but returns MASK (3D). `ImageToMask` throws `IndexError: too many indices for tensor`. Fix belongs in the upstream package. Ticket: https://github.com/EllangoK/ComfyUI-post-processing-nodes/issues/19
