# ComfyUI — AI Agent Entry Point

You've been asked to work with the user's ComfyUI setup.

**Everything you need is in `comfyai/` in the same directory as this file (the ComfyUI install directory).**

Start with [`comfyai/README.md`](comfyai/README.md) for the complete protocol. That file is the single source of truth for agent interaction — the other READMEs in `comfyai/nodes/`, `comfyai/hiddenswitch/`, etc. are task-specific sub-docs that `comfyai/README.md` routes you to.

---

## Quick orientation

| What you want | Where to look |
|---|---|
| Understand the current workflow | `comfyai/workflow-summary.md` (start here) |
| Full workflow graph | `comfyai/workflow-state.readonly.json` |
| Make changes to the workflow | Write to `comfyai/workflow-patch.json`, then trigger `comfyai/apply-patch-trigger.json` |
| Queue/run the current workflow in the panel | Write `{"command": "queue", "ts": <n>}` to `comfyai/apply-patch-trigger.json` |
| Stop an in-progress generation | Write `{"command": "interrupt", "ts": <n>}` to `comfyai/apply-patch-trigger.json` |
| Confirm a trigger was processed | Read `comfyai/apply-response.json` after every trigger write |
| Know what nodes are available | `comfyai/nodes/` — start with `index.md` |
| Know what models are available | `comfyai/available-models.json` |
| Revert a recent change | `comfyai/workflow-history/` — see `README.md` inside |
| Run a workflow silently (no panel) | `comfyai/hiddenswitch/run-workflow.md` |

**Critical rule**: Never write a full workflow JSON from scratch and never overwrite `workflow-state.readonly.json` directly. Always use the patch pattern. See `comfyai/README.md`.

---

## Directory notes

**`venv/` (or whatever `comfyui.venvDir` is set to)** — contains thousands of Python packages. Do not glob or scan it broadly. Use `venv/bin/pip list` to check installed packages, and go directly to known paths when you need source (e.g., `venv/lib/python3.x/site-packages/comfy/` for ComfyUI source). See `comfyai/hiddenswitch/README.md` for targeted search patterns.

**`models/`** — may not reflect all available models. ComfyUI resolves model files from multiple locations (HuggingFace cache, registered paths, symlinks). Use `comfyai/available-models.json` to see what the server actually knows about — not directory listings.

**`custom_nodes/vscode-comfyui-integration/`** — this is the extension's internal bridge node. It enables communication between the VSCode extension and the ComfyUI frontend. Do not modify it, do not read it for workflow information, and do not rely on its internals. It is managed entirely by the extension.
