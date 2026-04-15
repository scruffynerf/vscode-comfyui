# Troubleshooting

> Your notes: comfyai/wiki/ (persists across updates)

## Quick Reference

| Issue | Fix |
|---|---|
| Black screen | Add `--enable-cors-header` to startup args |
| Patch didn't apply | Re-read workflow-summary.md, check apply-response.json |
| Model not found | Use name from available-models.json, restart server |
| Queue does nothing | Panel must be open, ts must change |
| Generation slow | Check apple-silicon.md, use --novram on M-series |

**Full details below.**

---

Reference for when things go wrong. Return here only when the normal flow fails.

---

## ComfyUI panel shows a black screen

If the embedded ComfyUI panel is completely black (no UI loads), the most common cause is that the ComfyUI server is rejecting requests from the VS Code webview's origin.

**Fix**: add `--enable-cors-header` to your ComfyUI startup arguments.

In VS Code settings, find **ComfyUI: Startup Args** and add `--enable-cors-header`. Then restart the server.

This is required for any non-hiddenswitch ComfyUI install because the VS Code panel makes requests with a `vscode-webview://` origin that stock ComfyUI rejects by default. The hiddenswitch fork allows this origin automatically.

Note: you may see a `403 Forbidden` error in the VS Code Developer Tools console (Help → Toggle Developer Tools) if this is the cause.

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
3. Verify you re-read `workflow-summary.md` and `workflow-state.readonly.json` right before writing the patch. The workflow may have changed since you last read it.
4. If the patch applied but generation failed, check `user/comfyui.log` for validation errors.

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

## Checking whether a queued workflow succeeded

`apply-response.json` confirms the queue command was received — it does not know whether generation succeeded. To check:

```bash
curl http://localhost:8188/history
```

The response is a dict keyed by prompt ID. The most recent entry has:
- `status.status_str`: `"success"` or `"error"`
- `status.completed`: `true` / `false`
- `status.messages`: list including `"execution_start"`, `"execution_cached"`, `"execution_success"`, `"execution_error"`, or `"execution_interrupted"`
- `outputs`: dict of node outputs (images, etc.) — only present on success

For a quick check of just the most recent run:
```bash
curl -s http://localhost:8188/history | python3 -c "
import json, sys
h = json.load(sys.stdin)
if not h:
    print('No history')
else:
    latest = list(h.values())[-1]
    print(latest['status']['status_str'], latest['status']['messages'])
"
```

---

## Workflow execution was interrupted

If `apply-response.json` confirmed the queue but the workflow didn't produce output:

1. Check the server history: `curl http://localhost:8188/history` — look for `"status": "error"` and the `messages` array.
2. If `messages` includes `"execution_interrupted"`: **the user stopped the run manually**. This is normal. Do not re-queue without asking the user — they may have stopped it intentionally (wrong settings, changed their mind, etc.).
3. If `messages` includes `"execution_error"`: the workflow failed (bad model, OOM, etc.). Check `user/comfyui.log` for the error.

**Do not automatically re-queue after an interrupt.** Ask the user what they want to do next.

---

## Generation is very slow

On Apple Silicon (M-series), running with `--novram` is the **recommended default**, not a degraded mode. All memory is unified (shared CPU/GPU), so `--novram` prevents swap thrashing. Generation times will be slower than CUDA benchmarks — this is expected.

Typical ranges on M-series with `--novram`:
- Flux Schnell FP8, 4 steps: ~30–60 seconds per step depending on free memory
- More free unified memory = faster; closing other apps helps

If generation seems unreasonably slow, check:
1. `server-info.json` — look at `configuredStartupArgs` and `devices[0].vram_free` for current free memory
2. Whether the model is being re-loaded from disk every run (check log for `Loading ...` on each queue)
3. Step count — Flux Schnell is optimized for 1–4 steps; 20 steps is unnecessarily slow and won't improve quality

---

## Server log

When something fails silently, check the server log:

- **Location**: `user/comfyui.log` (in the ComfyUI install directory, the same directory that contains `comfyai/`)
- **Read efficiently**: use `tail -20 user/comfyui.log` — the file grows over time and reading the whole thing wastes context. Use `tail -50` if you need more history.
- **What to look for**:
  - `Failed to validate prompt` — model name wrong or node not configured
  - `Value not in list: ckpt_name: 'x.safetensors'` — model not in server's known list
  - `HTTP Request:` lines — model download in progress (may take minutes for large models)
  - `Prompt executed in X seconds` — successful run
  - `Processing interrupted` — user stopped the run (see above)
  - `400 Bad Request` — workflow format or connection error
