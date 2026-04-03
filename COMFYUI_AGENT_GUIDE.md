# ComfyUI — AI Agent Entry Point

You've been asked to work with the user's ComfyUI setup.

**Everything you need is in `comfyai/` in the same directory as this file (the ComfyUI install directory).**

Start with [`comfyai/README.md`](comfyai/README.md) for the complete protocol.

---

## Quick orientation

| What you want | Where to look |
|---|---|
| Understand the current workflow | `comfyai/workflow-summary.md` (start here) |
| Full workflow graph | `comfyai/workflow-state.readonly.json` |
| Make changes to the workflow | Write to `comfyai/workflow-patch.json`, then trigger `comfyai/apply-patch-trigger.json` |
| Know what nodes are available | `comfyai/nodes/` — start with `index.md` |
| Revert a recent change | `comfyai/workflow-history/` — see `README.md` inside |

**Critical rule**: Never write a full workflow JSON from scratch and never overwrite `workflow-state.readonly.json` directly. Always use the patch pattern. See `comfyai/README.md`.
