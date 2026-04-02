# ComfyAI Workflow History

This directory contains a snapshot for every patch applied through the ComfyAI bridge.

**Do not browse this directory during normal workflow editing.** Its purpose is revert and audit — not general reference.

---

## Entry format

Each file is named `<ISO-timestamp>.json` and contains:

```json
{
  "appliedAt": "2024-03-30T12:00:00.000Z",
  "signalTs": 1711800000,
  "patch": { ... },
  "snapshotBefore": { ... }
}
```

| Field | Purpose |
|---|---|
| `appliedAt` | When the patch was applied |
| `signalTs` | The `ts` value from the apply trigger |
| `patch` | The patch that was applied |
| `snapshotBefore` | **The complete workflow state immediately before this patch** |

---

## How to revert

To undo the most recent patch, load `snapshotBefore` from the latest history entry as a full workflow replacement.

**Step 1** — Find the entry to revert to. The most recent file (alphabetically last, since filenames are ISO timestamps) is the most recent patch.

**Step 2** — Extract `snapshotBefore` from that entry and save it as a temporary workflow file (e.g., `comfyai/revert-target.json`).

**Step 3** — Write a `sourcePath` trigger to apply it:

```json
{
  "sourcePath": "./comfyai/revert-target.json",
  "ts": 1711812001
}
```

Write this to `comfyai/apply-patch-trigger.json`. The extension will load the snapshot as the new workflow state.

---

## Notes

- History grows unboundedly. There is no automatic cleanup yet.
- Snapshots include the full graph — each entry can be large for complex workflows.
- To revert multiple steps, walk backwards through the timestamp-ordered entries and apply the appropriate `snapshotBefore`.
