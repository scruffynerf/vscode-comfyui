# LTX-Video Models

Reference for LTX-Video by Lightricks. LTX-Video is a fast, native-latent video generation model.

---

## Model variants

All LTX models are in `available-models.json` → `diffusion_models`. Load with `UNETLoader`.

**LTX-Video 2B** (original, smaller):
- `ltx-video-2b-v0.9.1.safetensors` — standard fp16
- `ltx-video-2b-v0.9.5.safetensors` — updated release

**LTX-2 (13B, "LTX 0.9.7")**:
- `ltx-video-0.9.7-13b-distilled.safetensors` — distilled for fewer steps
- `ltx-video-0.9.7-13b.safetensors` — full model

**LTX-2.3 (22B)**:
- `ltx-video-0.9.8-22b.safetensors` — highest quality

GGUF quantized variants also available for reduced VRAM.

---

## Companion files

| Role | Filename | Category |
|---|---|---|
| VAE | `ltx_vae.safetensors` or `ltx2_vae.safetensors` | `vae` |
| Text encoder | `t5xxl_fp16.safetensors` or `t5xxl_fp8_e4m3fn.safetensors` | `clip` |

CLIP loader: `T5Loader` or `CLIPLoader` depending on your ComfyUI version. LTX only uses T5 — no CLIP-L needed.

---

## Latent upscalers

In `available-models.json` → `latent_upscale_models`. Load with `LatentUpscaleModelLoader`.

| Model | For | Notes |
|---|---|---|
| `ltx-2-spatial-upscaler-x2-1.0.safetensors` | LTX-2 (13B) | 2× spatial |
| `ltx-2.3-spatial-upscaler-x2-1.0.safetensors` | LTX-2.3 (22B) | 2× spatial |
| `ltx-2.3-temporal-upscaler-x2-1.0.safetensors` | LTX-2.3 (22B) | 2× temporal (more frames) |

---

## Sampler settings

| Model | Steps | CFG | Sampler | Scheduler |
|---|---|---|---|---|
| LTX-Video 2B | 25–30 | 3.0–5.0 | `euler` | `linear` or `simple` |
| LTX-2 distilled | 8–12 | 1.0–3.0 | `euler` | `simple` |
| LTX-2.3 | 25–30 | 3.0 | `euler` | `simple` |

LTX-Video supports image-to-video natively — pass an image as the first-frame conditioning.

---

## Resolution and frame count

LTX operates in native latent resolution. Typical outputs:
- 768×512 or 512×768 (portrait/landscape)
- 25–121 frames (must be a multiple of 8 plus 1, e.g. 25, 33, 49, 97, 121)

LTX-2.3 supports up to 768×768 at 97 frames.

---

## Notes

- LTX uses T5-XXL only (no CLIP-L dual encoder)
- Very fast vs HunyuanVideo — trade-off is lower quality on complex motion
- Negative prompts are supported (unlike Flux)
- Distilled 13B variants need fewer steps but may show artifacts at very low step counts
