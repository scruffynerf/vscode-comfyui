# Workflow Design Principles

These principles apply when building or modifying a workflow. Read the relevant sections before making structural changes — not required reading for simple edits.

---

## Build incrementally

Start with the minimal working pipeline (checkpoint → CLIP → KSampler → VAE → save). Add ControlNet, LoRAs, upscaling one at a time. Validate each addition before continuing. A "black box" failure in a complex workflow almost always traces back to a skipped validation step.

---

## Keep stages visually separated

Group nodes by stage:

1. Model loading (checkpoint, VAE, LoRA, ControlNet)
2. Conditioning (CLIP encode, guidance)
3. Sampling (KSampler)
4. Decoding (VAE decode)
5. Post-processing (upscale, face restore)

When stages blur into each other, debugging becomes significantly harder. Use reroute nodes and spacing to maintain visual separation.

---

## Don't load the same model twice

If a workflow has multiple branches, wire the same MODEL/VAE/CLIP outputs to both branches. Duplicate loaders waste VRAM and add unnecessary execution time.

---

## Insert preview nodes at stage boundaries

`PreviewImage` and `PreviewLatent` at the output of each major stage make it easy to see where a problem starts. Remove them after the workflow is stable, or leave them — they don't affect final output.

---

## Use fixed seeds for debugging

When changing one variable at a time (prompt, sampler, steps), pin the seed. Variable seeds make it impossible to isolate causes.

---

## Keep it as simple as the goal requires

More nodes do not produce better results. Add complexity only when it gives clear value. Before adding a new node or stage, ask whether the goal can be achieved with what's already there.

---

## Design notes

- The user's goal drives structure. Don't impose complexity the user didn't ask for.
- When patching an existing workflow, preserve the structure and naming conventions already present — don't reorganize the graph unless asked.
- For hardware-specific performance considerations (resolution, steps), see `knowledge/apple-silicon.md` or `knowledge/models/model-settings.md`.
