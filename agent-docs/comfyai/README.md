# ComfyAI Agent Protocol

This directory is your interface to the user's ComfyUI workflow. Read this before doing anything.

---

## Which mode should you use?

Before touching any file here, answer two questions:

**Does the user want to see this change in their ComfyUI panel?**
→ Yes: use the **GUI bridge** (patch/apply below). Edits appear live in the user's workflow.

**Does this involve getting a result silently, testing code, or building/validating a custom node?**
→ Yes: use **hiddenswitch Python** — ComfyUI as a library, no GUI, no server needed. See `hiddenswitch/README.md`.

If the user asked you to *modify their workflow*, use the GUI bridge.
If the user asked you to *run something* or *build something*, use hiddenswitch.
When in doubt, ask the user which they prefer before proceeding.

---

## Files in this directory

| File | Purpose |
|---|---|
| `workflow-summary.md` | **Read this first.** Generated overview: inputs, outputs, model loaders, main pipeline, node IDs for common tasks. |
| `workflow-state.readonly.json` | Full workflow graph. READ ONLY — never write to this file directly. Use the patch pattern below. |
| `workflow-patch.json` | Write your partial changes here (nodes/links you want to add or modify). |
| `apply-patch-trigger.json` | Write this signal to trigger the extension to apply your patch. |
| `nodes/` | Node catalog. Start with `nodes/index.md` when you need to select or look up a node. |
| `workflow-history/` | Past patch snapshots. Enter only for revert operations — see `workflow-history/README.md`. |
| `hiddenswitch/` | Instructions for running ComfyUI as a Python library (silent execution, node dev/testing). |

---

## How to make changes: the patch pattern

**Always use this two-step approach. Never rewrite the full workflow.**

### Step 1 — Write your patch

Write only the nodes or links you want to add or change to `workflow-patch.json`.

```json
{
  "nodes": [{ "id": 5, "widgets_values": ["new prompt text"] }]
}
```

Nodes are merged by `id` into the current graph. Only include what changes.

Adding a new node? Use an `id` greater than `last_node_id` from `workflow-state.readonly.json`.
Adding a new link? Use a `link_id` greater than `last_link_id`. Links are arrays: `[link_id, src_node_id, src_slot, dst_node_id, dst_slot, dtype]`.

### Step 2 — Trigger the apply

Write this signal to `apply-patch-trigger.json`:

```json
{
  "patchPath": "./comfyai/workflow-patch.json",
  "ts": 1711812000
}
```

Change `ts` on every write — this is what fires the file watcher. Use `Date.now() / 1000`.

The extension merges your patch into the live graph in the ComfyUI panel.

---

## Loading a full workflow (replace, not patch)

To replace the entire workflow with a saved JSON file:

```json
{
  "sourcePath": "./path/to/workflow.json",
  "ts": 1711812000
}
```

Write this to `apply-patch-trigger.json`. Use `sourcePath` instead of `patchPath`.

---

## Reading state efficiently

1. Read `workflow-summary.md` first — it has node IDs for common tasks so you don't need to scan the full graph.
2. If you need a specific node's full detail, read `workflow-state.readonly.json` and look up by `id`.
3. Don't re-read state after writing a patch until the extension confirms it applied (summary regenerates automatically).

---

## Schemas

Formal JSON schemas for the two files you write are in `schemas/`:

| Schema | Validates |
|---|---|
| `schemas/workflow-patch.schema.json` | `workflow-patch.json` — node/link structure, required `id` field, link tuple format |
| `schemas/apply-patch-trigger.schema.json` | `apply-patch-trigger.json` — required `ts`, mutual exclusion of `patchPath`/`sourcePath`/`command` |

Read the relevant schema before writing if you're uncertain about field names or structure. The `description` fields inside each schema explain each property's purpose and constraints.

---

## Node catalog

See `nodes/README.md` for how to use the catalog. Short version:
1. Read `nodes/classes/index.md` to identify which operation class you need.
2. Read only that class file (`nodes/classes/source.md`, `nodes/classes/sampler.md`, etc.) for candidates.
3. Query `nodes/node-registry.json` by key for full schema — don't read the whole file.
