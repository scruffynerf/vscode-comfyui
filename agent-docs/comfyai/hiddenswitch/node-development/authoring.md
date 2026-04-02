# Authoring a Custom Node

<!-- TODO: This is a stub. Content to be expanded with full examples. -->

This document covers the structure and packaging of a custom node. Read `node-development/README.md` first if you haven't — it has verification steps before you should be here.

When you have the node structure in place, continue to `node-development/tdd-loop.md` to validate it before promoting.

---

## Project layout

```
my-nodes/
  pyproject.toml         ← entry-point registration
  my_nodes/
    __init__.py          ← NODE_CLASS_MAPPINGS declared here
    my_node.py           ← node implementation
  tests/
    __init__.py
    conftest.py
    test_workflows.py
    workflows/
      __init__.py        ← required (makes this a Python package for importlib.resources)
      test-basic.json    ← exported from ComfyUI UI, exercises your node
```

---

## Node structure

```python
# my_nodes/my_node.py
from comfy.nodes.package_typing import CustomNode


class MyNode(CustomNode):
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
                "strength": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 2.0}),
            }
        }

    RETURN_TYPES = ("IMAGE",)
    FUNCTION = "process"
    CATEGORY = "my_nodes"

    def process(self, image, strength):
        return (image * strength,)


# my_nodes/__init__.py
from .my_node import MyNode

NODE_CLASS_MAPPINGS = {"MyNode": MyNode}
NODE_DISPLAY_NAME_MAPPINGS = {"MyNode": "My Node"}
```

---

## pyproject.toml — the entry-point

The `comfyui.custom_nodes` entry-point tells hiddenswitch where to find your nodes. This is how they get loaded without copying files into `custom_nodes/`.

```toml
[project]
name = "my-comfyui-nodes"
version = "1.0.0"
dependencies = ["torch"]

[project.optional-dependencies]
test = [
    "comfyui @ git+https://github.com/hiddenswitch/ComfyUI.git",
    "pytest",
    "pytest-asyncio",
    "pillow",
]

[project.entry-points."comfyui.custom_nodes"]
my_nodes = "my_nodes"
```

Install for development:
```bash
cd {installDir} && uv pip install -e /path/to/my-nodes/[test]
```

---

When the node is written and the pyproject.toml is in place, go to `node-development/tdd-loop.md`.

<!-- TODO: Expand with: more INPUT_TYPES examples (INT, STRING, COMBO/dropdown, optional inputs), RETURN_NAMES, IS_CHANGED for caching control, common patterns for image/latent/mask handling, configuration entry-points (comfyui.custom_config) -->
