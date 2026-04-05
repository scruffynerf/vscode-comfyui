# Z-Image Models

Reference for Z-Image Turbo and Z-Image base — FLUX-architecture few-step image generation models.

---

## Model variants

- `z_image_turbo_bf16.safetensors` — Z-Image Turbo, distilled, 4–8 step generation
- `z_image_bf16.safetensors` — Z-Image base (non-turbo), more steps needed

Both appear in `available-models.json` → `diffusion_models`. Load with `UNETLoader`.

---

## Companion files

### Z-Image Turbo

| Role | Filename | Category |
|---|---|---|
| VAE | `z_image_turbo_vae.safetensors` | `vae` |
| Text encoder | `qwen_3_4b.safetensors` | `clip` |

CLIP loader: `CLIPLoader` (single encoder).

### Z-Image base

Uses the same companions as Turbo (VAE and text encoder are shared from the same Comfy-Org repo). Verify against a test run if behavior differs.

---

## Sampler settings (Turbo)

- Steps: 4–8
- CFG: 1.0 (distilled — CFG-free)
- Sampler: `euler`
- Scheduler: `simple`

The "Turbo" in the name means it's distilled for few-step generation, similar to FLUX Schnell. Do not run at 20+ steps — quality does not improve and may degrade.

---

## Wiring pattern

```
UNETLoader (z_image_turbo_bf16.safetensors)
  ↓ MODEL

CLIPLoader (qwen_3_4b.safetensors)
  ↓ CLIP

CLIPTextEncode (positive)
CLIPTextEncode (negative)

VAELoader (z_image_turbo_vae.safetensors)
  ↓ VAE

EmptyLatentImage
  ↓ LATENT

KSampler → VAEDecode → SaveImage
```

---

## Notes

- Z-Image uses a Qwen 3 4B language model as its text encoder — this is substantially larger than CLIP-L and responds well to natural language descriptions (similar to FLUX's T5 behavior).
- The VAE (`z_image_turbo_vae.safetensors`) is a renamed copy of the standard FLUX `ae.safetensors` — do not substitute SDXL or SD1.5 VAEs.
