# ComfyAI Workflow History

This directory contains a history entry for every action triggered through the ComfyAI bridge: patches, full loads, and commands. Entries with `snapshotBefore` are revertable; commands (queue, interrupt, etc.) are logged for audit but cannot be reverted.

**Do not browse this directory during normal workflow editing.** Its purpose is revert and audit — not general reference.

---

## Entry format

Each file is named `<ISO-timestamp>.json` and contains:

```json
{
  "appliedAt": "2024-03-30T12:00:00.000Z",
  "signalTs": 1711800000,
  "notes": "testing prompt variation",
  "patch": { ... },
  "snapshotBefore": { ... }
}
```

| Field | Purpose |
|---|---|
| `appliedAt` | When the action was applied |
| `signalTs` | The `ts` value from the apply trigger |
| `notes` | The `notes` field from the trigger (null if not provided) |
| `patch` | The patch that was applied (null for commands) |
| `snapshotBefore` | **The complete workflow state immediately before this action** (null for commands) |

---

## How to revert

**Only patches and full loads are revertable.** Commands (queue, interrupt, restart-server, etc.) have no `snapshotBefore` and cannot be reverted.

**Step 1** — Find the most recent entry with `snapshotBefore` not null. Walk backwards through timestamp-ordered files until you find one.

**Step 2** — Extract `snapshotBefore` from that entry and save it as a temporary workflow file (e.g., `comfyai/revert-target.json`).

**Step 3** — Write a `sourcePath` trigger to apply it:

```json
{
  "sourcePath": "./comfyai/revert-target.json",
  "ts": 1711812001,
  "notes": "reverting to previous state"
}
```

Write this to `comfyai/apply-trigger.json`. The extension will load the snapshot as the new workflow state.

**To revert multiple steps:** walk backwards through the entries, skipping those with null `snapshotBefore`, and apply the first `snapshotBefore` you find.

---

## Using Notes

Always include a `notes` field in your apply triggers to document what you're doing. Notes appear in two places:

- **`apply-response.json`** — echoed back so you can confirm what was done
- **`workflow-history/`** — permanent audit trail

```json
{"patchPath": "./comfyai/workflow-patch.json", "ts": N, "notes": "testing darker lighting variation"}
{"command": "queue", "ts": N, "notes": "generating test batch for prompt A"}
{"command": "restart-server", "ts": N, "notes": "after installing FLUX model"}
```

This makes the history useful for audit and debugging.

---

## Notes

- History grows unboundedly. There is no automatic cleanup yet.
- Snapshots include the full graph — each entry can be large for complex workflows.
- To revert multiple steps, walk backwards through the timestamp-ordered entries and apply the appropriate `snapshotBefore`.
