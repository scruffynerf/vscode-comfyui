# Python API Reference

> Your notes: comfyai/wiki/ (persists across updates)

**This is a reference document. Look up what you need — do not read the whole file.**

Come here from a task document (`run-workflow.md`, `tdd-loop.md`, etc.) when you need specifics. When you have what you need, return to the task document and continue.

---

## Configuration options

```python
from comfy.cli_args import default_configuration
from comfy.cli_args_types import PerformanceFeature

config = default_configuration()
```

| Option | Type | When to use |
|--------|------|-------------|
| `config.guess_settings = True` | bool | Auto-detect GPU, VRAM mode, attention backend. Use when server is NOT running. |
| `config.novram = True` | bool | Offload weights to CPU between ops. Use when user's server IS active, or VRAM ≤ 16 GB. |
| `config.disable_all_custom_nodes = True` | bool | Skip loading custom nodes. Faster startup, clean isolation for base-ComfyUI tests. |
| `config.disable_pinned_memory = True` | bool | Required when system RAM < 32 GB. Prevents memory thrashing. |
| `config.fast = {PerformanceFeature.CublasOps}` | set | cuBLAS ops on NVIDIA Ampere (RTX 30xx+). |
| `config.disable_known_models = True` | bool | Prevent automatic model downloads. |

Batch-apply: `config.update({"novram": True, "guess_settings": True})`.

---

## Workflow format conversion

`queue_prompt` accepts both formats automatically. To convert explicitly:

```python
import json
from comfy.component_model.workflow_convert import is_ui_workflow, convert_ui_to_api

workflow = json.loads(open("my_workflow.json").read())
if is_ui_workflow(workflow):
    workflow = convert_ui_to_api(workflow)
```

---

## Running multiple workflows with the same client

Reuse the client — models stay loaded between runs:

```python
from pathlib import Path
from comfy.api.components.schema.prompt import Prompt

async with Comfy(configuration=config) as client:
    for path in sorted(Path("./workflows").glob("*.json")):
        prompt = Prompt.validate(json.loads(path.read_text()))
        outputs = await client.queue_prompt(prompt)
        print(f"{path.name}: {outputs}")
```

---

## Streaming progress and previews

```python
from comfy.api.components.schema.prompt import Prompt
from comfy.component_model.queue_types import BinaryEventTypes

prompt = Prompt.validate(workflow)
async with Comfy() as client:
    task = client.queue_with_progress(prompt)

    async for notification in task.progress():
        if notification.event == BinaryEventTypes.PREVIEW_IMAGE_WITH_METADATA:
            image_data, metadata = notification.data
            # image_data.pil_image is a PIL Image of the current denoising step

    result = await task.get()
    save_id = next(k for k, v in prompt.items() if v.get("class_type") == "SaveImage")
    return result.outputs[save_id]["images"][0]["abs_path"]
```

---

## ProcessPoolExecutor — full VRAM isolation between runs

```python
from comfy.distributed.process_pool_executor import ProcessPoolExecutor

with ProcessPoolExecutor(max_workers=1) as executor:
    async with Comfy(configuration=config, executor=executor) as client:
        outputs = await client.queue_prompt(workflow)
```

Each `queue_prompt` call runs in a subprocess. VRAM is fully released when the process exits. Use for test suites that load different models.

---

## Output structure

`outputs` is keyed by node ID (string). Structure depends on node type:

```python
# SaveImage node
outputs[node_id]["images"][0]["abs_path"]   # absolute path to saved file
outputs[node_id]["images"][0]["filename"]   # filename only
outputs[node_id]["images"][0]["subfolder"]  # subfolder within output dir

# Other node types: inspect outputs[node_id] — keys match node's RETURN_NAMES
```

---

## Model downloading

See `reference/models.md`.
