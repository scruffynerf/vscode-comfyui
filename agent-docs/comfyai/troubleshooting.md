# Troubleshooting

Reference for when things go wrong. Return here only when the normal flow fails.

---

## apply-response.json error messages

After every trigger write, read `apply-response.json`. If `status` is `"error"`:

| Message | Cause | Fix |
|---|---|---|
| `patchPath not found: ...` | Patch file path is wrong or file wasn't written | Check the path; write `workflow-patch.json` first |
| `sourcePath not found: ...` | Source workflow file doesn't exist at that path | Verify the file exists before triggering |
| `ComfyUI panel is not open` | Panel webview isn't active | Tell the user to open the ComfyUI panel |
| `Extension error: ...` | Unexpected error (bad JSON, etc.) | Read the message; fix the trigger or patch file |

If `apply-response.json` doesn't exist at all, the extension hasn't processed any trigger this session. Check that the ComfyUI panel is open and the extension is active (look for the ComfyUI item in the VSCode status bar).

---

## Patch didn't appear in the panel

1. Read `apply-response.json` — if `status` is `"error"`, the message explains why.
2. Verify `apply-patch-trigger.json` is valid JSON and `ts` changed from your last write.
3. If the patch applied but generation failed, check `user/comfyui.log` for validation errors.

---

## Queue command did nothing

1. Read `apply-response.json` — it will say `"ComfyUI panel is not open"` if the panel webview isn't active.
2. Ensure the ComfyUI panel tab is open in VSCode (not just in the background — the webview must be loaded).
3. Verify `ts` changed from your last trigger write.

---

## Model not found / `Value not in list`

1. Check `available-models.json` — use only model names from that list.
2. If the name is in the list but the server rejects it, the server may need a restart to pick up a newly registered model.
3. Check `user/comfyui.log` for the exact validation error message.

---

## Workflow is empty after loading

If `workflow-state.readonly.json` shows zero nodes after you expected a workflow to be there, the panel may not have fired a sync yet. Open the ComfyUI panel in VSCode — the state file updates on the next panel event.

An empty state on a fresh install is also normal. The user needs to open or create a workflow in the panel first.

---

## Server log

When something fails silently, check the server log:

- **Location**: `user/comfyui.log` (in the ComfyUI install directory, the same directory that contains `comfyai/`)
- **What to look for**:
  - `Failed to validate prompt` — model name wrong or node not configured
  - `Value not in list: ckpt_name: 'x.safetensors'` — model file not downloaded/installed
  - `HTTP Request:` lines — model download progress
  - `Prompt executed in X seconds` — successful run
  - `400 Bad Request` — workflow format or connection error
