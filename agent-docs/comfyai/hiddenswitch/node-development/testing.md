# Testing Custom Nodes — pytest Patterns

Use this when you want repeatable, automated tests for your custom node. For the manual write-test-iterate loop, see `tdd-loop.md` first.

<!-- TODO: This is a stub. Expand with: snapshot testing via pytest-image-diff, parametrizing across GPU configurations (attention backends, VRAM modes), CI/GitHub Actions setup. -->

---

## conftest.py — the client fixture

```python
import pytest
from comfy.client.embedded_comfy_client import Comfy
from comfy.cli_args import default_configuration
from comfy.distributed.process_pool_executor import ProcessPoolExecutor
from comfy.model_downloader import add_known_models
from comfy.model_downloader_types import HuggingFile

# Register models your test workflows reference — downloads on demand from HF
add_known_models("checkpoints", HuggingFile(
    "stabilityai/stable-diffusion-v1-5",
    "v1-5-pruned-emaonly.safetensors"
))


@pytest.fixture(scope="function")
async def client():
    config = default_configuration()
    config.novram = True
    config.disable_all_custom_nodes = False   # True = test base ComfyUI only
    with ProcessPoolExecutor(max_workers=1) as executor:
        async with Comfy(configuration=config, executor=executor) as c:
            yield c
```

`ProcessPoolExecutor` runs each test in a subprocess — VRAM is fully released between tests, preventing state leakage. Use it for test suites that load different models.

---

## test_workflows.py — discover and run all test workflows

```python
import importlib.resources, json, pytest
from comfy.api.components.schema.prompt import Prompt
from comfy.client.embedded_comfy_client import Comfy
from PIL import Image
from . import workflows


def _discover():
    return {
        f.name: f
        for f in importlib.resources.files(workflows).iterdir()
        if f.is_file() and f.name.endswith(".json")
    }


@pytest.mark.asyncio
@pytest.mark.parametrize("name, wf", _discover().items())
async def test_workflow(name, wf, client: Comfy):
    prompt = Prompt.validate(json.loads(wf.read_text(encoding="utf8")))
    outputs = await client.queue_prompt(prompt)
    assert len(outputs) > 0


@pytest.mark.asyncio
async def test_output_image(client: Comfy):
    wf = importlib.resources.files(workflows).joinpath("test-basic.json")
    prompt = Prompt.validate(json.loads(wf.read_text()))
    outputs = await client.queue_prompt(prompt)
    save_id = next(k for k, v in prompt.items() if v.get("class_type") == "SaveImage")
    img = Image.open(outputs[save_id]["images"][0]["abs_path"])
    assert img.size == (512, 512)
```

Run tests:
```bash
cd {installDir}
pytest /path/to/my-nodes/tests/ -x -vv
pytest /path/to/my-nodes/tests/ -k "test-basic" -vv
```

---

## Mocking folder paths

This fork uses execution-context-scoped folder paths. Do not use `unittest.mock.patch` on `folder_paths`. Use `FolderNames` and `context_folder_names_and_paths` instead:

```python
from comfy.component_model.folder_path_types import FolderNames
from comfy.execution_context import context_folder_names_and_paths

fn = FolderNames()
fn["custom_nodes"] = ([str(my_custom_nodes_dir)], set())   # set(), not None
with context_folder_names_and_paths(fn):
    # create objects that read folder_paths at init time INSIDE this block
    manager = CustomNodeManager()
```
