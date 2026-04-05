# Patch Reference

Full protocol for making changes to the workflow via the GUI bridge.

---

## The patch pattern

**Always use this two-step approach. Never rewrite the full workflow from scratch.**

### Step 1 — Write your patch

Write only the nodes or links you want to add or change to `workflow-patch.json`:

```json
{
  "nodes": [{ "id": 5, "widgets_values": ["new prompt text"] }]
}
```

Nodes are merged by `id` into the current graph. Only include what changes — unspecified fields are preserved.

**Batch unrelated changes into one patch.** `nodes` is an array — if you need to update steps, swap the checkpoint, and change both prompts, put all four node updates in a single patch and trigger once. Only split into separate patches when a later change depends on the result of an earlier one (e.g. an atomic node type replacement where you need to know the new ID).

**Key rules:**
- **`widgets_values` is a complete array** — include every element in order, not just the field you're changing. Read the current values from `workflow-state.readonly.json` first. See "Widget array layouts" below.
- **COMBO widget values are always strings** — never `true`/`false` or `1`/`0`. For common nodes, the examples in "Widget array layouts" below show the correct values. For any other node, check `comfyai/nodes/widget-enums.json` first (compact lookup: `enums["NodeType"]["input_name"]` → list of valid strings). If it's not there, it's a model file list — check `comfyai/available-models.json`. As a last resort, `input.required.<field_name>[0]` in `node-registry.json` is the authoritative source.
- **New nodes** — use an `id` greater than `last_node_id`. Verify the type exists in `node-registry.json` first (unregistered types are silently dropped).
- **New links** — use a `link_id` greater than `last_link_id`. Format: `[link_id, src_node_id, src_slot, dst_node_id, dst_slot, dtype]`. Link slots and widget array positions are different numbering systems — see "Link slots vs widget positions" below.

### Deleting nodes and links

```json
{ "remove_nodes": [10] }
```
LiteGraph automatically disconnects all links attached to a removed node.

```json
{ "remove_links": [5] }
```
Disconnects a specific link without removing its nodes (use link IDs from `workflow-state.readonly.json`).

Removals are processed **before** adds/updates — you can delete and re-add in a single patch.

### Step 2 — Trigger the apply

Write this to `apply-patch-trigger.json`:

```json
{
  "patchPath": "./comfyai/workflow-patch.json",
  "ts": 1711812000
}
```

Change `ts` on every write — this is what fires the file watcher. Any monotonically increasing integer works.

Then **read `apply-response.json`** to confirm. If `status` is `"error"` → see `troubleshooting.md`.

---

## Loading a full workflow (replace, not patch)

```json
{ "sourcePath": "./path/to/workflow.json", "ts": 1711812000 }
```

Write to `apply-patch-trigger.json`. Use `sourcePath` instead of `patchPath`. This replaces the entire workflow.

---

## Commands

Write any of these to `apply-patch-trigger.json`. Always increment `ts`.

| Command | Effect |
|---|---|
| `{"command": "queue", "ts": n}` | Run the workflow currently loaded in the panel (once) |
| `{"command": "queue", "count": 3, "ts": n}` | Queue N runs — useful when seed is set to "randomize" |
| `{"command": "queue-status", "ts": n}` | Check current queue: how many running/pending, and the running prompt_id |
| `{"command": "interrupt", "ts": n}` | Stop an in-progress generation |
| `{"command": "auto-layout", "ts": n}` | Auto-arrange all nodes (left-to-right, removes overlaps) |
| `{"command": "restart-server", "ts": n}` | Restart the ComfyUI server — waits until responsive, then reloads panel and refreshes catalog |
| `{"command": "refresh-catalog", "ts": n}` | Re-fetch `/object_info` and rebuild all catalog files — use after installing a custom node |
| `{"command": "open-panel", "ts": n}` | Create or reload the ComfyUI panel in VS Code |
| `{"command": "testing-mode", "logPath": "feedback/testN", "ts": n}` | Enable per-action log file reminders in every `apply-response.json` |
| `{"command": "testing-mode", "enabled": false, "ts": n}` | Disable testing reminders |

**`restart-server` vs `refresh-catalog`:**
- Use `restart-server` when you've edited `hiddenswitch/config/model-includes.json` or `model-veto.json` (the Python init node runs at server startup), or after any change that requires reloading Python code.
- Use `refresh-catalog` when you've installed a new custom node and want to pick up its new node types without a full restart. This is the programmatic equivalent of the "ComfyUI: Refresh Node Catalog" command palette entry. `restart-server` already includes a catalog refresh — don't send both.
- `restart-server` is blocking: `apply-response.json` is written only after the server is back up. The wait can take 30–90 seconds.

**Queue triggers are fire-and-forget.** ComfyUI has a built-in queue — multiple runs buffer automatically. You do NOT need to wait for a generation to finish before queuing another. You can also freely interleave patches and queue triggers:

```
write queue trigger (ts=10)   → queues run 1
write seed patch + trigger (ts=11)   → updates seed
write queue trigger (ts=12)   → queues run 2 with new seed
write seed patch + trigger (ts=13)   → updates seed again
write queue trigger (ts=14)   → queues run 3
```

All three runs will execute in order. No waiting required between any of these writes.

**After queueing — always do this:**
1. Wait for generation to complete.
2. **`tail -20 user/comfyui.log`** — fastest way to confirm success or see why it failed. Look for `Prompt executed in X seconds` (success) or `Failed to validate prompt` (failure).
3. Outputs land in the `output/` directory.
4. Or poll: `GET http://localhost:8188/history` → look for `status.status_str`.

If generation fails → check `user/comfyui.log` first. The log shows the actual error (invalid model name, bad COMBO value, OOM). The history API only shows a code. See `troubleshooting.md` for the full diagnostic guide.

**Auto-layout and groups:** `auto-layout` does not reposition groups. If the workflow has groups, nodes will move out of their group boundaries. Either fix group `bounding` afterward with a patch, or set `pos` manually on just the nodes you want to move.

---

## Widget array layouts

`widgets_values` is a flat array containing every widget's value in order. You must always supply the complete array — there is no partial update.

### `control_after_generate` — hidden extra entry

INT widgets that show a "randomize / fixed / increment" control (like `noise_seed`) serialize **two consecutive entries**: the integer value, then the control string (`"randomize"`, `"fixed"`, `"increment"`, or `"decrement"`). This makes the array longer than the node's visible input count.

**KSampler** — 7 entries:
```
[seed, control_after, steps, cfg, sampler_name, scheduler, denoise]
```
Example: `[156680208700286, "randomize", 20, 8.0, "euler", "normal", 1.0]`

**KSamplerAdvanced** — 10 entries:
```
[add_noise, noise_seed, control_after, steps, cfg, sampler_name, scheduler, start_at_step, end_at_step, return_with_leftover_noise]
```
Example: `["enable", 0, "randomize", 20, 8.0, "euler", "normal", 0, 10000, "disable"]`

**Always verify** the full widget array from an existing node in `workflow-state.readonly.json` before writing patches for unfamiliar node types. Don't rely solely on the node registry schema — it won't show the `control_after_generate` slot explicitly.

---

## Link slots vs widget positions

These are **two completely separate numbering systems**. Do not mix them.

- **Input slots** (for links) — numbered 0, 1, 2… for each connected input like model, conditioning, latent. These are the `dst_slot` values in your link array.
- **`widgets_values` positions** — numbered 0, 1, 2… for each widget (seed, steps, cfg, etc.). Unrelated to link slots.

**KSamplerAdvanced example:**

| What | Index | Notes |
|---|---|---|
| Link input: model | slot 0 | used in `[link_id, src, src_slot, dst, **0**, dtype]` |
| Link input: positive | slot 1 | |
| Link input: negative | slot 2 | |
| Link input: latent_image | slot 3 | |
| Widget: add_noise | array[0] | used in `widgets_values[0]` |
| Widget: noise_seed | array[1] | |
| Widget: control_after | array[2] | |
| Widget: steps | array[3] | |

Check the node's `inputs` list in `node-registry.json` to get the correct slot indices for any node.

---

## Replacing a node's type

To swap a node for one with a different type (e.g. KSampler → KSamplerAdvanced):

1. **Find the old node's links** — read `workflow-state.readonly.json`. Note the node's ID, its link connections, and `last_node_id` / `last_link_id` for fresh IDs.

2. **Write an atomic patch** with `remove_nodes` (old ID) + `nodes` (new node, fresh ID) + `links` (reconnected using the *new* node's slot indices):

```json
{
  "remove_nodes": [3],
  "nodes": [{
    "id": 10,
    "type": "KSamplerAdvanced",
    "pos": [400, 300],
    "widgets_values": ["enable", 0, "randomize", 20, 8.0, "euler", "normal", 0, 10000, "disable"]
  }],
  "links": [
    [10, 1, 0, 10, 0, "MODEL"],
    [11, 6, 0, 10, 1, "CONDITIONING"],
    [12, 7, 0, 10, 2, "CONDITIONING"],
    [13, 5, 0, 10, 3, "LATENT"]
  ]
}
```

3. Removals run before adds — the old node is gone by the time the new one is created. The apply-response returns `status: ok` for this pattern.

**Link IDs can be reused.** When a node is removed, its attached links are destroyed. You can safely reuse those link IDs when reconnecting the replacement node — the old links are gone before the new ones are created. Fresh IDs are also fine; either works.

**Why you cannot just patch `type` in place:** `type` is only applied when *creating* a new node. Patching `type` on an existing node (without `remove_nodes`) is silently ignored and the apply-response will warn you.
