# Wan 2.x Models

Reference for Wan 2.1 and Wan 2.2 video generation models.

---

## Model variants

**Wan 2.1** — text-to-video and image-to-video:
- `wan2.1_t2v_1.3B_bf16.safetensors` — 1.3B lightweight, good for testing
- `wan2.1_t2v_14B_bf16.safetensors` / `fp8` — 14B, primary quality model
- `wan2.1_i2v_480p_14B_bf16.safetensors` / `fp8` — image-to-video 480p
- `wan2.1_i2v_720p_14B_bf16.safetensors` / `fp8` — image-to-video 720p

**Wan 2.2** — higher quality, same companion files as 2.1:
- `wan2.2_t2v_high_noise_14B_fp16.safetensors` / `fp8` — standard t2v
- `wan2.2_t2v_low_noise_14B_fp16.safetensors` / `fp8` — alternative sampler variant
- `wan2.2_i2v_high_noise_14B_fp16.safetensors` / `fp8` — i2v

All appear in `available-models.json` → `diffusion_models`. Load with `UNETLoader`.

---

## Companion files

| Role | Filename | Category | Notes |
|---|---|---|---|
| VAE (Wan 2.1) | `wan_2.1_vae.safetensors` | `vae` | |
| VAE (Wan 2.2) | `wan2.2_vae.safetensors` | `vae` | |
| Text encoder | `umt5_xxl_fp8_e4m3fn_scaled.safetensors` | `clip` | Use fp16 variant for max quality |
| CLIP Vision (i2v only) | `clip_vision_h.safetensors` | `clip_vision` | Required for image-to-video workflows |

CLIP loader: `CLIPLoader` (single encoder, not dual).

For i2v workflows: also wire `CLIPVisionLoader` → `CLIPVisionEncode` with the input image.

---

## Sampler settings

- Steps: 20–30
- CFG: 6.0
- Sampler: `euler`
- Scheduler: `linear_quadratic`
- Resolution: 832×480 (480p) or 1280×720 (720p)
- Frame count: 81 frames typical (about 3–4 seconds at 24fps)

---

## Wiring pattern (t2v)

```
UNETLoader (wan2.1_t2v_14B_bf16.safetensors)
  ↓ MODEL

CLIPLoader (umt5_xxl_fp8_e4m3fn_scaled.safetensors)
  ↓ CLIP

CLIPTextEncode (positive)
CLIPTextEncode (negative)

VAELoader (wan_2.1_vae.safetensors)
  ↓ VAE

EmptyHunyuanLatentVideo (or EmptyLatentVideo)
  ↓ LATENT

KSampler → VAEDecodeTiled → SaveAnimatedWEBP / VHS_VideoCombine
```

---

## LoRAs

Wan LoRAs load with `LoraLoader` as normal. Several speed LoRAs exist:
- Lightx2v distilled LoRAs (4-step) — in `loras` category, various filenames
- CausVid LoRAs — in `loras` category

Check `available-models.json` → `loras` for what's available.
