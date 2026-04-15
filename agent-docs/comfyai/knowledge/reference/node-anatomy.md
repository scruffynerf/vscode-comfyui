# ComfyUI Node Anatomy

> Your notes: comfyai/wiki/ (persists across updates)

## Quick Reference

| Section | Purpose |
|---|---|
| INPUT_TYPES() | Defines inputs (IMAGE, FLOAT, STRING, etc.) |
| RETURN_TYPES | Output types |
| FUNCTION | Method name to call |
| CATEGORY | Location in node browser |

**Full skeleton and patterns below.**

---

Reference for the structure of any ComfyUI node. Use this when writing a new node or analyzing an existing one. For hiddenswitch-specific packaging and testing, see `hiddenswitch/node-development/authoring.md`.

---

## Minimal node skeleton

```python
from comfy.nodes.package_typing import CustomNode


class MyNode(CustomNode):
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
                "strength": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 2.0}),
            },
            "optional": {
                "mask": ("MASK",),   # arrives as None if not wired
            },
        }

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("result",)
    FUNCTION = "process"
    CATEGORY = "my_nodes"
    OUTPUT_NODE = False   # True only for terminal sinks (SaveImage, PreviewImage)

    def process(self, image, strength, mask=None):
        return (image * strength,)   # must return a tuple matching RETURN_TYPES


# __init__.py
NODE_CLASS_MAPPINGS = {"MyNode": MyNode}
NODE_DISPLAY_NAME_MAPPINGS = {"MyNode": "My Node"}
```

---

## INPUT_TYPES reference

Every input is a tuple of `("TYPE", {options})`.

| Type | Spec | Notes |
|---|---|---|
| `INT` | `("INT", {"default": 0, "min": 0, "max": 100, "step": 1})` | Renders as a slider |
| `FLOAT` | `("FLOAT", {"default": 1.0, "min": 0.0, "max": 10.0, "step": 0.01})` | |
| `STRING` | `("STRING", {"default": "", "multiline": False})` | `"multiline": True` for prompt text areas |
| `BOOLEAN` | `("BOOLEAN", {"default": False})` | |
| Dropdown | `(["option1", "option2", "option3"],)` | List literal = dropdown; first item is default |
| `IMAGE` | `("IMAGE",)` | Tensor: `[B, H, W, C]` float32 0–1 |
| `MASK` | `("MASK",)` | Tensor: `[B, H, W]` float32 0–1 |
| `LATENT` | `("LATENT",)` | Dict: `{"samples": tensor [B, C, H, W]}` |
| Custom | `("MYTYPE",)` | Any string = custom type for wiring between nodes |

---

## RETURN_NAMES

Display names for each output slot. Length must match `RETURN_TYPES`:

```python
RETURN_TYPES = ("IMAGE", "MASK")
RETURN_NAMES = ("processed_image", "alpha_mask")
```

---

## IS_CHANGED — cache control

ComfyUI caches node outputs and skips re-execution when inputs are unchanged. Override `IS_CHANGED` when your node has state that changes independently:

```python
@classmethod
def IS_CHANGED(cls, **kwargs):
    return kwargs.get("seed", 0)   # different value → re-execute
```

Return `float("nan")` to force re-execution on every run. Use sparingly — it defeats caching entirely.

---

## Model management

```python
import comfy.model_management as mm

device = mm.get_torch_device()   # active compute device (CUDA / MPS / CPU)
mm.unload_all_models()           # free VRAM before loading a large model
mm.soft_empty_cache()            # gentle cache clear after generation
```

Load models once (at class init or via a cache), never inside the execution function.

---

## Design rules

See `knowledge/best-practices.md` for the full list. Short version:

- One node, one responsibility
- Declare exactly the types you return — mismatches cause silent downstream failures
- `OUTPUT_NODE = True` only for terminal sinks (nodes with no outputs or that write to disk/screen)
- Tensor formats: IMAGE is `[B, H, W, C]`, MASK is `[B, H, W]`, LATENT is a dict with `"samples"` key
- Provide safe defaults so the node works without full configuration
- No hidden side effects — deterministic given the same inputs and seed
