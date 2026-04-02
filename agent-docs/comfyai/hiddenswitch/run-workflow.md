# Running a Workflow Silently

Use this when the user wants a result generated without touching their live workflow.

When you're done here, return the result (typically a file path) to the user and stop. Do not modify their workflow unless they ask.

---

## Choose your execution path

**Have a workflow JSON file and just need to run it?**
→ Use the CLI. Simpler, no Python required.

**Need to modify the workflow in Python, or need structured outputs?**
→ Use the embedded Python API below.

**User's ComfyUI server is already running and holding models in VRAM?**
→ Use the remote client to submit to it instead of loading models a second time.

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

---

## Path 2 — Embedded Python

```python
import asyncio, json
from comfy.client.embedded_comfy_client import Comfy
from comfy.cli_args import default_configuration

workflow = json.loads(open("my_workflow.json").read())
# Also accepts API-format dict directly — queue_prompt converts either format

async def run():
    config = default_configuration()
    config.guess_settings = True   # auto-detect GPU and VRAM mode
    # config.novram = True         # use this instead when user's server is active

    async with Comfy(configuration=config) as client:
        outputs = await client.queue_prompt(workflow)

    save_node_id = next(k for k in workflow if workflow[k]["class_type"] == "SaveImage")
    return outputs[save_node_id]["images"][0]["abs_path"]

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
png_bytes = await client.queue_prompt(workflow)

with open("result.png", "wb") as f:
    f.write(png_bytes)
```

Default address is `http://localhost:8188`. This returns raw PNG bytes, not a structured outputs dict.

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
