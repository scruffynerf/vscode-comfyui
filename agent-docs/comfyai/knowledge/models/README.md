# Model-Specific Knowledge

This directory contains knowledge specific to individual model families or cross-model infrastructure (VAE, settings).

If you arrived here without a specific model in mind, go back to `knowledge/index.md` — it will route you to the right file based on your task.

| File | Contents |
|---|---|
| `flux.md` | Loading, dual encoders, FluxGuidance, FP8/FP16, negative prompt behavior |
| `sdxl.md` | Base + refiner workflow, dual CLIP, aesthetic scores, VAE fp16 fix |
| `model-settings.md` | Pre-flight sampler settings by model family, AIO vs diffusion-only taxonomy |
| `vae.md` | VAE selection, mismatch symptoms, per-model VAE requirements |
