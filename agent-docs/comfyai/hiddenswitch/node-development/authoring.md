# Packaging a Custom Node for Hiddenswitch

This document covers the hiddenswitch-specific packaging: project layout, entry-point registration, and dev install. Read `knowledge/node-anatomy.md` first — it covers the node class structure, INPUT_TYPES, and all the ComfyUI-standard patterns.

When the node is packaged and installed, go to `node-development/tdd-loop.md`.

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

Install for development (editable, with test deps):

```bash
cd {installDir} && uv pip install -e /path/to/my-nodes/[test]
```

---

When the entry-point is registered and the dev install is done, go to `node-development/tdd-loop.md`.
