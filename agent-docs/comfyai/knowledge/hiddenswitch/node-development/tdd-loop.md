# The TDD Loop — Write, Test, Promote

Use this loop to validate a custom node before it ever touches the user's live environment.

<!-- TODO: This is a partial stub. Core loop is documented. Expand with: more assertion examples, common failure modes, handling missing models in test workflows. -->

---

## The loop

```
1. Write node code  (authoring.md)
2. Export a test workflow from ComfyUI UI that exercises the node
3. Run it via embedded ComfyUI — assert on outputs
4. Fix and repeat
5. Promote only when tests pass
```

Steps 2–4 run entirely silently. The user's running server and workflow are never touched.

---

## Step 2 — Get a test workflow

The easiest path: build a small workflow in the user's ComfyUI UI that uses your node, then export it:
- **Save → API Format** for a clean JSON dict
- Or plain **Save** (UI format) — `queue_prompt` accepts both

Put the file in `tests/workflows/test-basic.json` and create an empty `tests/workflows/__init__.py` next to it (required for `importlib.resources` to find it).

---

## Step 3 — Run and assert

```python
import asyncio, importlib.resources, json
from comfy.client.embedded_comfy_client import Comfy
from comfy.cli_args import default_configuration
from comfy.api.components.schema.prompt import Prompt
from PIL import Image
from tests import workflows   # the workflows/ sub-package

async def test():
    workflow = json.loads(
        importlib.resources.files(workflows).joinpath("test-basic.json").read_text()
    )
    prompt = Prompt.validate(workflow)

    config = default_configuration()
    config.novram = True
    config.disable_all_custom_nodes = False   # load your node via entry-point

    async with Comfy(configuration=config) as client:
        outputs = await client.queue_prompt(prompt)

    save_id = next(k for k, v in prompt.items() if v.get("class_type") == "SaveImage")
    img = Image.open(outputs[save_id]["images"][0]["abs_path"])
    assert img.size == (512, 512)
    print("PASS")

asyncio.run(test())
```

For pytest-based test structure, see `node-development/testing.md`.

---

## Step 5 — Promote

Once tests pass, install the package into the user's environment:

```bash
cd {installDir}

# From a local directory
uv pip install /path/to/my-nodes/

# Or from git
uv pip install git+https://github.com/yourname/my-comfyui-nodes.git
```

The user's ComfyUI server needs a restart to pick up the new nodes. They'll appear in the node menu under the `CATEGORY` you declared.

**Never copy files directly into `custom_nodes/`.** The entry-point installation path keeps code in the venv with its dependencies properly tracked.
