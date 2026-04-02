# GraphBuilder — Building Workflows in Python

Use this when you need to construct a ComfyUI workflow programmatically rather than by editing JSON by hand.

<!-- TODO: This document is a stub with open questions. The core API is documented below and is usable. The open questions section must be resolved before the "load into GUI" path can be recommended. -->

---

## What GraphBuilder produces

`GraphBuilder.finalize()` returns an **API-format JSON dict** — the same format as "Save → API Format" in the ComfyUI UI. This is fully valid input to `client.queue_prompt()`.

**Critical distinction**: API-format JSON is NOT the same as UI-format JSON. The UI-format includes node positions, colors, and graph layout metadata. API format contains only execution data. This matters for the question of whether GraphBuilder output can be loaded into the user's panel — see Open Questions below.

---

## Basic usage

```python
from comfy_execution.graph_utils import GraphBuilder

builder = GraphBuilder()

checkpoint = builder.node(
    "CheckpointLoaderSimple",
    ckpt_name="v1-5-pruned-emaonly.safetensors",
)
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

Node output slot indices for `CheckpointLoaderSimple`: `out(0)` = MODEL, `out(1)` = CLIP, `out(2)` = VAE.

To run the built workflow, see `run-workflow.md` (embedded Python path).

---

## Open questions — loading GraphBuilder output into the user's panel

These are unresolved. Do not attempt the "load into GUI" path until they are answered.

**Question 1**: ComfyUI PR #1932 (Comfy-Org/ComfyUI) added support for loading API-format JSON in the frontend. Does the hiddenswitch fork include this change?
- If yes: API-format JSON from `finalize()` may be loadable via a frontend API call
- If no: only UI-format JSON can be loaded into the panel

**Question 2**: The extension's `sourcePath` mechanism in `apply-patch-trigger.json` — does it accept API-format JSON or only UI-format?
- If UI-format only: GraphBuilder output cannot be loaded via the current bridge without conversion

**Question 3**: Is there a utility to add UI layout metadata (node positions, etc.) to API-format JSON?
- A `finalize_ui()` variant or similar would make GraphBuilder output directly panel-loadable
- Worth requesting from the hiddenswitch dev if it doesn't exist

**Question 4**: Possible paths for loading a GraphBuilder workflow into the user's panel:
1. `sourcePath` bridge — if it accepts API format (unconfirmed)
2. Frontend API call to `/api/v1/prompts` or a load endpoint (needs investigation)
3. New hiddenswitch feature to push directly to a new tab or replace current workflow
4. Convert API format to UI format (if a reverse converter exists or can be built)

**Until these are resolved**: GraphBuilder output can only be *run* (via `queue_prompt`), not *shown* in the panel. If the user wants to see the workflow, use the patch/apply bridge from [comfyai/README.md](../README.md) to build the UI-format workflow instead.

---

## When to use GraphBuilder vs JSON dict

Use GraphBuilder when:
- The workflow has many nodes and connections — the typed API prevents link errors
- You're building the workflow conditionally in Python (branching, loops)
- You want IDE autocomplete support on node names

Use a plain JSON dict when:
- You're starting from a workflow the user exported (load the JSON directly)
- The workflow is small and the structure is clear

`queue_prompt` accepts both — no conversion needed.
