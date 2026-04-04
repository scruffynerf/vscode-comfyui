# Knowledge Index

Find the entry that matches your current decision. Read only that file.

---

## Building or modifying a workflow

**"What are the core nodes in a typical pipeline and how do they connect?"**
→ `knowledge/core-pipeline-nodes.md`

**"What structural principles should I follow when building a workflow?"**
→ `knowledge/workflow-design.md`

**"What's the idiomatic way to wire X? (negative conditioning, etc.)"**
→ `knowledge/workflow-patterns.md`

---

## Generation settings

**"What resolution / aspect ratio should I use for this model?"**
→ `knowledge/resolution.md`

**"Which sampler? How many steps? What CFG value?"**
→ `knowledge/samplers.md`

**"What sampler settings are correct for Flux / SDXL / SD1.5?"** (quick table)
→ `knowledge/models/model-settings.md`

**"How should I write the prompt for this model family?"**
→ `knowledge/prompting.md`

---

## Workflow techniques

**"How do I do img2img (transform an existing image)?"**
→ `knowledge/img2img.md`

**"How do I do inpainting (edit a masked area)?"**
→ `knowledge/inpainting.md`

**"How do I get a sharp high-resolution result? (hires fix / two-pass upscale)"**
→ `knowledge/hires-fix.md`

**"How do I add structural control — pose, depth, edges? (ControlNet)"**
→ `knowledge/controlnet.md`

**"How do I use a LoRA? What strength should I set?"**
→ `knowledge/loras.md`

**"How do I stack multiple LoRAs? How do LoRAs behave differently on Flux vs SDXL?"**
→ `knowledge/loras-stacking.md`

---

## Model-specific patterns

**"I'm using Flux — how do I load it, wire the dual encoders, use FluxGuidance?"**
→ `knowledge/models/flux.md`

**"I'm using SDXL — base + refiner workflow, dual CLIP encoders, aesthetic scores?"**
→ `knowledge/models/sdxl.md`

**"My output is gray / washed out / dark — which VAE should I use?"**
**"Does this model need a standalone VAE?"**
→ `knowledge/models/vae.md`

**"Is this model AIO or does it need separate CLIP/VAE loaders?"**
**"What are the correct sampler settings for Flux Schnell vs Flux Dev vs SDXL?"**
→ `knowledge/models/model-settings.md`

**"Why is generation slow on Apple Silicon? What are realistic times?"**
→ `knowledge/apple-silicon.md`

---

## Custom node development

**"What does a ComfyUI node class look like? INPUT_TYPES, RETURN_TYPES, IS_CHANGED?"**
→ `knowledge/node-anatomy.md`

**"What are the design principles for building a good node?"**
→ `knowledge/best-practices.md`

For hiddenswitch-specific packaging and testing, see `hiddenswitch/node-development/README.md`.

---

If your question doesn't fit any of the above, it may not be documented yet. Check `nodes/find-a-node.md` for node-specific guidance, or ask the user.
