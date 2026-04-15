# Knowledge Index

Find the entry that matches your current decision. Read only that file.

---

## Building or modifying a workflow

**"What are the core nodes in a typical pipeline and how do they connect?"**
→ `workflow/core-pipeline-nodes.md`

**"What structural principles should I follow when building a workflow?"**
→ `workflow/workflow-design.md`

**"What's the idiomatic way to wire X? (negative conditioning, etc.)"**
→ `workflow/workflow-patterns.md`

---

## Workflow techniques

**"How do I do img2img (transform an existing image)?"**
→ `techniques/img2img.md`

**"How do I do inpainting (edit a masked area)?"**
→ `techniques/inpainting.md`

**"How do I get a sharp high-resolution result? (hires fix / two-pass upscale)"**
→ `techniques/hires-fix.md`

**"How do I add structural control — pose, depth, edges?"**
→ `techniques/controlnet.md`

---

## Generation settings

**"What resolution / aspect ratio should I use for this model?"**
→ `guidance/resolution.md`

**"Which sampler? How many steps? What CFG value?"**
→ `guidance/samplers.md`

**"How should I write the prompt for this model family?"**
→ `guidance/prompting.md`

**"How do I use a LoRA? What strength should I set?"**
→ `guidance/loras.md`

**"How do I stack multiple LoRAs? How do LoRAs behave differently on Flux vs SDXL?"**
→ `guidance/loras-stacking.md`

---

## Model-specific patterns

**"I'm using Flux — how do I load it, wire the dual encoders, use FluxGuidance?"**
→ `models/image_models/flux.md`

**"I'm using SDXL — base + refiner workflow, dual CLIP encoders, aesthetic scores?"**
→ `models/image_models/sdxl.md`

**"My output is gray / washed out / dark — which VAE should I use?"**
**"Does this model need a standalone VAE?"**
→ `models/vae.md`

**"Why is generation slow on Apple Silicon? What are realistic times?"**
→ `hardware/apple-silicon.md`

---

## Reference

**"How do I apply a patch / trigger a command?"**
→ `reference/apply-trigger-reference.md`

**"Something went wrong — how do I debug?"**
→ `reference/troubleshooting.md`

**"What does a ComfyUI node class look like?"**
→ `reference/node-anatomy.md`

**"How do I run ComfyUI silently / build a custom node?"**
→ `hiddenswitch/README.md`

---

For hiddenswitch-specific node development, see `hiddenswitch/node-development/README.md`.

If your question doesn't fit any of the above, it may not be documented yet. Check `nodes/find-a-node.md` for node-specific guidance, or ask the user.
