# GraphBuilder — Building Workflows in Python

> Your notes: comfyai/wiki/ (persists across updates)

Use this when you need to construct a ComfyUI workflow programmatically rather than by editing JSON by hand. GraphBuilder is the right tool for **generating complete new workflows from scratch**. For modifying an existing workflow in the panel, use the patch/apply bridge instead — see [comfyai/README.md](../README.md).

<!-- TODO: The "load into GUI" path has open questions — see below. Until resolved, GraphBuilder output can only be run silently, not shown in the panel. -->

---

## What GraphBuilder produces

`GraphBuilder.finalize()` returns an **API-format JSON dict** — the same format as "Save → API Format" in the ComfyUI UI. Pass it directly to `client.queue_prompt()`.

**Critical distinction**: API-format JSON is NOT the same as UI-format JSON. UI-format includes node positions, colors, and layout metadata. API format contains only execution data. See "Loading into the panel" below.

---

## Basic usage

```python
from comfy_execution.graph_utils import GraphBuilder

builder = GraphBuilder()

checkpoint = builder.node("CheckpointLoaderSimple", ckpt_name="v1-5-pruned-emaonly.safetensors")
latent = builder.node("EmptyLatentImage", width=512, height=512, batch_size=1)
positive = builder.node("CLIPTextEncode", text="a cat on the moon", clip=checkpoint.out(1))
negative = builder.node("CLIPTextEncode", text="bad hands, blurry", clip=checkpoint.out(1))
sampled = builder.node(
    "KSampler",
    seed=42, steps=20, cfg=7.5,
    sampler_name="euler", scheduler="normal", denoise=1.0,
    model=checkpoint.out(0),
    positive=positive.out(0),
    negative=negative.out(0),
    latent_image=latent.out(0),
)
decoded = builder.node("VAEDecode", samples=sampled.out(0), vae=checkpoint.out(2))
builder.node("SaveImage", filename_prefix="ComfyAI", images=decoded.out(0))

workflow = builder.finalize()   # API-format dict — pass to queue_prompt
```

To run the built workflow, see [run-workflow.md](run-workflow.md).

---

## Looking up output slot indices

GraphBuilder **inputs** use keyword argument names (e.g. `model=`, `clip=`, `vae=`) — these come directly from the node schema and are self-documenting.

GraphBuilder **outputs** use positional slot indices: `.out(0)`, `.out(1)`, `.out(2)`. To find which slot corresponds to which output, look up the node in `comfyai/nodes/output-slot-index.json`:

```python
import json
slots = json.load(open("comfyai/nodes/output-slot-index.json"))["index"]

# CheckpointLoaderSimple: [{"name":"MODEL","type":"MODEL"}, {"name":"CLIP","type":"CLIP"}, {"name":"VAE","type":"VAE"}]
for i, slot in enumerate(slots["CheckpointLoaderSimple"]):
    print(f".out({i}) → {slot['name']} ({slot['type']})")
# .out(0) → MODEL (MODEL)
# .out(1) → CLIP (CLIP)
# .out(2) → VAE (VAE)
```

The same slot numbers apply to patch link `src_slot` values — the two systems share the same numbering.

---

## Finding valid COMBO (enum) widget values

COMBO inputs accept only specific string values — passing an invalid string causes a silent failure or runtime error. Do not guess; look them up.

**`comfyai/nodes/widget-enums.json`** contains valid values for all non-model COMBO inputs (model file lists are in `comfyai/available-models.json`):

```python
import json
enums = json.load(open("comfyai/nodes/widget-enums.json"))["enums"]

print(enums["KSampler"]["sampler_name"])
# ['euler', 'euler_cfg_pp', 'euler_ancestral', 'euler_ancestral_cfg_pp', 'heun', ...]

print(enums["KSampler"]["scheduler"])
# ['normal', 'karras', 'exponential', 'sgm_uniform', 'simple', 'ddim_uniform', ...]
```

If a COMBO input doesn't appear in `widget-enums.json`, it's a model file list — look it up in `comfyai/available-models.json` instead.

---

## Validating connections before building

GraphBuilder does not enforce type compatibility at build time — mismatches only surface at execution. To validate before running:

1. Get the source node's output type from `output-slot-index.json`:
   ```python
   src_type = slots["KSampler"][0]["type"]   # "LATENT"
   ```

2. Get the destination input's required type from `node-registry.json`:
   ```python
   registry = json.load(open("comfyai/nodes/node-registry.json"))
   dst_type = registry["VAEDecode"]["input"]["required"]["samples"][0]   # "LATENT"
   ```

3. They must match exactly: `src_type == dst_type`.

See [connection-types.md](../nodes/connection-types.md) for the full list of pipeline types and the exact-match rule.

---

## Class names vs display names

Node class names (used in `builder.node(...)`) may differ from the labels shown in the ComfyUI UI. If you know only the display name, look up the class name first:

```python
idx = json.load(open("comfyai/nodes/display-name-index.json"))
class_name = idx["displayToClass"].get("K-Sampler", "K-Sampler")   # → "KSampler"
```

---

## Loading into the panel

**Open questions — do not attempt the "load into GUI" path until resolved.**

`GraphBuilder.finalize()` produces API-format JSON. The panel uses UI-format JSON. These are not the same.

**Question 1**: Does the hiddenswitch fork include ComfyUI PR #1932 (API-format loading in the frontend)?
- If yes: API-format JSON may be loadable via a frontend API call.

**Question 2**: Does the extension's `sourcePath` bridge accept API-format JSON or only UI-format?

**Question 3**: Is there a `finalize_ui()` variant or layout utility that adds position metadata to API-format output?

**Possible paths when resolved:**
1. `sourcePath` trigger in `apply-trigger.json` — if it accepts API format
2. Frontend API call (needs investigation)
3. New hiddenswitch feature to push directly to a tab
4. API → UI format conversion (if a converter exists)

**Until resolved**: use `queue_prompt` to run the workflow silently. If the user wants to see it in the panel, build it with the patch/apply bridge instead.

---

## When to use GraphBuilder vs patch/apply

| | GraphBuilder | Patch/apply |
|---|---|---|
| Generate a workflow from scratch | Best choice | Tedious |
| Modify an existing workflow | Not suited — rebuild from scratch | Best choice |
| Run silently without showing in panel | Yes (`queue_prompt`) | Yes (`command: queue`) |
| Show result in panel | Blocked (open questions above) | Yes |
| Conditional / loop logic in Python | Yes | No |

Use a plain JSON dict (not GraphBuilder) when starting from a workflow the user exported — load it directly into `queue_prompt`, no conversion needed.
