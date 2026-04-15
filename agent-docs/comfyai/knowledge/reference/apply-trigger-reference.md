# Apply Trigger Reference

The apply trigger file (`apply-trigger.json`) is the bridge between the agent and the ComfyUI panel. It handles:
- **Patches** — merge changes into the current workflow
- **Full loads** — replace the entire workflow
- **Commands** — queue, interrupt, restart, etc.

> Read from top → do → stop. Only read further if your case doesn't fit.

---

## Quick Example (patching a prompt)

**Step 1** — `workflow-patch.json`:
```json
{"nodes": [{"id": 5, "widgets_values": ["new prompt text"]}]}
```

**Step 2** — `apply-trigger.json`:
```json
{"patchPath": "./comfyai/workflow-patch.json", "ts": N}
```

**Always include `notes`** to log what you're doing. The notes appear in:
- `apply-response.json` — echoed back so you can confirm what was done
- `workflow-history/` — permanent audit trail

```json
{"patchPath": "./comfyai/workflow-patch.json", "ts": N, "notes": "testing prompt variation with darker lighting"}
```

---

## Commands

Write to `apply-trigger.json`. All commands support the optional `notes` field. Notes are echoed in `apply-response.json` and logged to `workflow-history/`.

| Command | Effect | Example notes |
|---|---|---|
| `{"command": "queue", "ts": n}` | Run the workflow | `"testing prompt X"` |
| `{"command": "queue", "count": 3, "ts": n}` | Queue N runs | |
| `{"command": "queue-status", "ts": n}` | Check queue status | |
| `{"command": "interrupt", "ts": n}` | Stop in-progress generation | `"aborting bad generation"` |
| `{"command": "auto-layout", "ts": n}` | Auto-arrange nodes | `"cleaning up layout"` |
| `{"command": "restart-server", "ts": n}` | Restart server, reload panel + catalog | `"after installing new model"` |
| `{"command": "refresh-catalog", "ts": n}` | Refresh node catalog | `"new custom node installed"` |
| `{"command": "open-panel", "ts": n}` | Open panel | |
| `{"command": "testing-mode", "logPath": "...", "ts": n}` | Enable log reminders | |
| `{"command": "testing-mode", "enabled": false, "ts": n}` | Disable log reminders | |

**Queue triggers are fire-and-forget.** ComfyUI queues multiple runs.

**After queueing:** Wait for completion, then `tail -20 user/comfyui.log`. Or poll `GET http://localhost:8188/history`.

---

## Patching a Workflow

### Two-step pattern

**Always use this approach. Never rewrite the full workflow from scratch.**

#### Step 1 — Write your patch

Write only the nodes or links you want to add or change to `workflow-patch.json`:

```json
{
  "nodes": [{ "id": 5, "widgets_values": ["new prompt text"] }]
}
```

Nodes are merged by `id` into the current graph. Only include what changes — unspecified fields are preserved.

**Batch unrelated changes into one patch.** `nodes` is an array.

**Key rules:**
- **`widgets_values` is a complete array** — include every element in order. Read the current values from `workflow-state.readonly.json` first.
- **COMBO widget values are always strings** — never `true`/`false` or `1`/`0`. Check `nodes/widget-enums.json` or `available-models.json`.
- **New nodes** — use an `id` greater than `last_node_id`. Verify the type exists in `nodes/node-registry.json`.
- **New links** — use a `link_id` greater than `last_link_id`. Format: `[link_id, src_node_id, src_slot, dst_node_id, dst_slot, dtype]`.

#### Deleting nodes and links

```json
{ "remove_nodes": [10] }
```

```json
{ "remove_links": [5] }
```

Removals are processed **before** adds/updates.

#### Step 2 — Trigger the apply

```json
{
  "patchPath": "./comfyai/workflow-patch.json",
  "ts": 1711812000,
  "notes": "what this patch does"
}
```

Change `ts` on every write — this fires the file watcher. Then **read `apply-response.json`** to confirm.

---

## Loading a Full Workflow

```json
{ "sourcePath": "./path/to/workflow.json", "ts": 1711812000, "notes": "loading Flux portrait template" }
```

Use `sourcePath` instead of `patchPath`. Replaces the entire workflow.

---

## Widget Array Layouts

`widgets_values` is a flat array — must supply the complete array.

### `control_after_generate` — hidden extra entry

INT widgets with "randomize / fixed / increment" serialize **two consecutive entries**: the value, then the control string.

**KSampler — 7 entries:**
```
[seed, control_after, steps, cfg, sampler_name, scheduler, denoise]
```

**KSamplerAdvanced — 10 entries:**
```
[add_noise, noise_seed, control_after, steps, cfg, sampler_name, scheduler, start_at_step, end_at_step, return_with_leftover_noise]
```

**Always verify** the full widget array from `workflow-state.readonly.json`.

---

## Link Slots vs Widget Positions

**Two separate numbering systems.**

- **Input slots** (for links) — numbered 0, 1, 2… used in link arrays
- **`widgets_values` positions** — numbered 0, 1, 2… for widgets

---

## Replacing a Node's Type

1. **Find the old node's links** — read `workflow-state.readonly.json`.
2. **Write an atomic patch** with `remove_nodes` + `nodes` + `links`:

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

3. Removals run before adds.

**Why you cannot just patch `type`:** `type` is only applied when creating a new node.
