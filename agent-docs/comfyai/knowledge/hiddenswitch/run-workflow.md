# Running a Workflow Silently

> Your notes: comfyai/wiki/ (persists across updates)

Use this when the user wants a result generated without touching their live workflow.

When you're done here, return the result (typically a file path) to the user and stop. Do not modify their workflow unless they ask.

---

## Choose your execution path

**Start with Path 1 (CLI) unless you have a specific reason not to.** It is the most reliable and handles format conversion automatically.

| Situation | Path |
|-----------|------|
| Just run a workflow file and get the output path | **Path 1 — CLI** (most reliable, try this first) |
| Need to modify the workflow in Python before running | Path 2 — Embedded Python |
| Server is running, want to reuse loaded models in VRAM | Path 3 — Remote client |

**Known failure modes:**
- **Path 2** crashes on macOS without an `if __name__ == '__main__':` guard (multiprocessing spawn requirement — see example below)
- **Path 3** returns 0 bytes with no exception if given UI-format JSON; only accepts API-format; check output file size before assuming success

---

## Path 1 — CLI (simplest)

```bash
# Run a workflow file (auto-detects GPU and VRAM settings)
{installDir}/{venv}/bin/comfyui run-workflow my_workflow.json --guess-settings

# Run with explicit low-VRAM mode (safe default when server is active)
{installDir}/{venv}/bin/comfyui run-workflow my_workflow.json --novram

# Override prompt/seed/steps at the command line
{installDir}/{venv}/bin/comfyui run-workflow my_workflow.json \
  --prompt "a cat on the moon" --steps 20 --seed 42

# Pipe a workflow from stdin
cat my_workflow.json | {installDir}/{venv}/bin/comfyui run-workflow -
```

Outputs are printed as JSON to stdout. Check for a `SaveImage` node's output in the result.

Accepts both UI-format JSON (Save) and API-format JSON (Save → API Format) — converts automatically.

**Output directory**: the CLI writes output images to `<cwd>/output/` — wherever you run the command from, not necessarily `comfyui-workspace/output/`. To avoid confusion, either run the command from inside `{installDir}/` or pass `--output-dir` explicitly:

```bash
{installDir}/{venv}/bin/comfyui run-workflow my_workflow.json --novram \
  --output-dir {installDir}/output
```

---

## Path 2 — Embedded Python

**macOS requirement**: Always wrap `asyncio.run()` in `if __name__ == '__main__':`. macOS uses `spawn` for multiprocessing (Python 3.8+); without this guard the script crashes with `RuntimeError: An attempt has been made to start a new process before the current process has finished its bootstrapping phase.`

```python
import asyncio, json
from comfy.client.embedded_comfy_client import Comfy
from comfy.cli_args import default_configuration

async def run():
    config = default_configuration()
    config.guess_settings = True   # auto-detect GPU and VRAM mode
    # config.novram = True         # use this instead when user's server is active

    workflow = json.loads(open("my_workflow.json").read())
    # Also accepts API-format dict directly — queue_prompt converts either format

    async with Comfy(configuration=config) as client:
        outputs = await client.queue_prompt(workflow)

    save_node_id = next(k for k in workflow if workflow[k]["class_type"] == "SaveImage")
    return outputs[save_node_id]["images"][0]["abs_path"]

if __name__ == '__main__':
    path = asyncio.run(run())
    print(path)
```

**VRAM rule**: Use `config.novram = True` whenever the user's ComfyUI server is running. It offloads model weights to CPU RAM between operations, preventing OOM. Use `guess_settings = True` when the server is not active — it auto-detects the right mode.

For configuration options (novram, fast, disable_all_custom_nodes, etc.), see `reference/python-api.md`.

---

## Reading outputs

The `outputs` dict is keyed by node ID. For a `SaveImage` node:

```python
outputs[node_id]["images"][0]["abs_path"]   # absolute path to the saved image file
```

To open it:
```python
from PIL import Image
img = Image.open(outputs[save_node_id]["images"][0]["abs_path"])
```

Other node types: inspect `outputs[node_id]` — keys depend on the node's declared return types.

---

## Path 3 — Remote client (submit to running server)

When the user's server is already active, submit to it rather than loading models twice:

```python
from comfy.client.aio_client import AsyncRemoteComfyClient

client = AsyncRemoteComfyClient(server_address="http://localhost:8188")
png_bytes = await client.queue_prompt(workflow)  # workflow must be API format

with open("result.png", "wb") as f:
    f.write(png_bytes)

# Always verify — silent failure returns 0 bytes with no exception
assert len(png_bytes) > 0, "queue_prompt returned empty — check workflow format and server log"
```

Default address is `http://localhost:8188`. This returns raw PNG bytes, not a structured outputs dict.

**Important**: This client expects **API-format** JSON (node IDs as keys, `class_type`/`inputs` structure), not UI-format (the `nodes`/`links` arrays from Save). If you have a UI-format workflow, use Path 1 (CLI auto-converts) or Path 2 instead. Passing UI-format to this client returns 0 bytes silently.

---

## Harmless warnings to ignore

On macOS, Python scripts may print messages like:

```
objc[12345]: Class AVFFrameReceiver is implemented in both
  .../site-packages/av/.dylibs/libavdevice.61.3.100.dylib
  and
  .../site-packages/cv2/.dylibs/libavdevice.61.3.100.dylib
This may cause spurious casting failures and mysterious crashes.
```

This is harmless — it comes from duplicate `libavdevice` dylibs in the `av` and `cv2` packages and does not affect ComfyUI execution. Ignore it.

---

## Checking required packages before running

If the workflow uses custom nodes, check what's needed first:

```bash
{installDir}/{venv}/bin/comfyui workflows requirements path/to/workflow.json
```

Install any missing packages:
```bash
cd {installDir}
uv pip install --extra-index-url https://nodes.appmana.com/simple/ <package-name>
```
