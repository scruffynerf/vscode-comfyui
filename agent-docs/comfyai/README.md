# ComfyAI Agent Protocol

This directory is your interface to the user's ComfyUI workflow. Read this before doing anything.

---

## Which mode should you use?

Before touching any file here, answer these questions in order:

**Does the user want to see this change in their ComfyUI panel?**
→ Yes: use the **GUI bridge** (patch/apply below). Edits appear live in the user's workflow.

**Does the user want to run/queue the workflow that's already in the panel?**
→ Yes: use the **GUI bridge** — write `{"command": "queue", "ts": <n>}` to `apply-patch-trigger.json`. Do NOT use hiddenswitch for this.

**Does this involve getting a result silently, testing code, or building/validating a custom node — with no GUI involvement at all?**
→ Yes: use **hiddenswitch Python** — ComfyUI as a library, no GUI, no server needed. See `hiddenswitch/README.md`.

**Is a ComfyUI server already running (panel is open, you can see the UI)?**
→ Use the **GUI bridge** (triggers above) or the **server HTTP API** (`http://localhost:8188/...`). Do NOT start a hiddenswitch embedded Python client alongside a running server — they are separate processes and will conflict or duplicate work.

When in doubt, ask the user which they prefer before proceeding.

---

## Files in this directory

| File | Purpose |
|---|---|
| `workflow-summary.md` | **Read this first.** Generated overview: inputs, outputs, model loaders, main pipeline, node IDs for common tasks. |
| `workflow-state.readonly.json` | Full workflow graph. READ ONLY — never write to this file directly. Use the patch pattern below. |
| `workflow-patch.json` | Write your partial changes here (nodes/links you want to add or modify). |
| `apply-patch-trigger.json` | Write this signal to trigger the extension to apply your patch. |
| `apply-response.json` | **Read this after every trigger write** to confirm success or get an error message. Written by the extension. |
| `available-models.json` | Model names the server knows about: checkpoints, VAEs, LoRAs, ControlNets, etc. |
| `server-info.json` | Server configuration: launch args, device (MPS/CUDA/CPU), VRAM, Python/torch versions. Written on panel open. |
| `nodes/` | Node catalog. Start with `nodes/README.md` when you need to select or look up a node. |
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

Nodes are merged by `id` into the current graph. Only include what changes — unspecified fields are preserved. For example, to move node 4:

```json
{ "nodes": [{ "id": 4, "pos": [200, 400] }] }
```

Adding a new node? Use an `id` greater than `last_node_id` from `workflow-state.readonly.json`.
Adding a new link? Use a `link_id` greater than `last_link_id`. Links are arrays: `[link_id, src_node_id, src_slot, dst_node_id, dst_slot, dtype]`.

**Link IDs are reassigned.** The extension assigns its own IDs using the internal `last_link_id` counter — the IDs you specify in a patch are not preserved. After adding links, re-read `workflow-state.readonly.json` to get the actual assigned IDs if you need to reference them later.

**Correcting a node's `type` drops its links.** If you patch a node to fix its type name, the extension may drop existing links to/from that node because it can't validate them against the new type. After any type correction, verify the node's links in `workflow-state.readonly.json` and add a second patch to reconnect any that were dropped.

### Step 2 — Trigger the apply

Write this signal to `apply-patch-trigger.json`:

```json
{
  "patchPath": "./comfyai/workflow-patch.json",
  "ts": 1711812000
}
```

Change `ts` on every write — this is what fires the file watcher. Any monotonically increasing integer works.

Then read `apply-response.json` to confirm success. If `status` is `"error"`, the message says why. See `troubleshooting.md` for the full error table.

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

## Commands

Write any of these to `apply-patch-trigger.json`. Always increment `ts`.

| Command | Effect |
|---|---|
| `{"command": "queue", "ts": n}` | Run the workflow currently loaded in the panel |
| `{"command": "interrupt", "ts": n}` | Stop an in-progress generation |
| `{"command": "auto-layout", "ts": n}` | Auto-arrange all nodes (left-to-right, removes overlaps) |
| `{"command": "testing-mode", "logPath": "feedback/testN", "ts": n}` | Enable testing reminders — every `apply-response.json` will include a `log_file` (e.g. `feedback/testN/log-1005.md`) and a `testing_reminder` telling you exactly what to write there |
| `{"command": "testing-mode", "enabled": false, "ts": n}` | Disable testing reminders |

**After queueing:** the extension confirms the trigger was received, but not whether the workflow actually succeeded. To check execution status, poll:
```
GET http://localhost:8188/history
```
Look for the most recent entry: `status.status_str` will be `"success"` or `"error"`, and `status.messages` will include `"execution_error"` or `"execution_interrupted"` if something went wrong. See `troubleshooting.md` for how to interpret the result.

**Auto-layout warning**: groups are not repositioned. If the workflow has groups, nodes will move out of their group boundaries, leaving the layout broken. Either fix the group bounds afterward with a patch (compute new `bounding` from the updated node positions), or skip auto-layout and set `pos` manually on just the nodes you want to move.

---

## Reading state efficiently

1. Read `workflow-summary.md` first — it has node IDs for common tasks so you don't need to scan the full graph.
2. If you need a specific node's full detail, read `workflow-state.readonly.json` and look up by `id`.
3. After a successful patch, both `workflow-state.readonly.json` and `workflow-summary.md` update automatically once the change is reflected in the panel.
4. **Do not use a cached copy of `workflow-summary.md` from earlier in your context.** Re-read the file when you need current state — your cached version becomes stale as soon as the user or agent applies any patch.

---

## Model names

Before referencing a model in a workflow, check `available-models.json` for valid names. Use the exact string. Keys present: `checkpoints`, `vae`, `loras`, `controlnet`, `upscale_models`, `clip_vision`, `unclip_models`. A key is omitted if that loader type isn't available.

**Models in this list will be auto-downloaded on first use.** The hiddenswitch server manages its own known-model list and fetches models as needed when a workflow runs. A model appearing in `available-models.json` does not mean it's already on disk — it means the server knows how to get it.

If the name you need isn't listed, the server can't load it. In that case, check with the user — they may need to download the model manually.

---

## Schemas

Formal JSON schemas for the two files you write are in `schemas/`:

| Schema | Validates |
|---|---|
| `schemas/workflow-patch.schema.json` | `workflow-patch.json` |
| `schemas/apply-patch-trigger.schema.json` | `apply-patch-trigger.json` |

---

## Node catalog

See `nodes/README.md`. Short version: read `nodes/classes/index.md` to find your operation class, then read only that class file. Query `nodes/node-registry.json` by key for full schema — don't read the whole file.

---

## Troubleshooting

See `troubleshooting.md` — patch didn't apply, queue did nothing, model not found, empty workflow, server log location.
