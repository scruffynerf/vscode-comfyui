# HunyuanVideo

Reference for HunyuanVideo text-to-video and image-to-video models.

---

## Model variants

- `hunyuan_video_t2v_720p_bf16.safetensors` — text-to-video, 720p
- `hunyuan_video_image_to_video_720p_bf16.safetensors` — image-to-video, 720p

Both in `available-models.json` → `diffusion_models`. Load with `UNETLoader`.

---

## Companion files

| Role | Filename | Category |
|---|---|---|
| VAE | `hunyuan_video_vae_bf16.safetensors` | `vae` |
| Text encoder | `llava_llama3_fp8_scaled.safetensors` | `clip` |
| CLIP Vision (i2v) | `llava_llama3_vision.safetensors` | `clip_vision` |

CLIP loader: `CLIPLoader` (single encoder, llama3 vision model).

---

## Sampler settings

- Steps: 20–30
- CFG: 1.0 (guidance via dedicated node)
- Sampler: `euler`
- Scheduler: `simple`
- Resolution: 848×480 or 1280×720
- Frame count: 129 frames typical

<!-- TODO: Confirm exact sampler settings and node wiring pattern for HunyuanVideo — needs a test workflow. The HunyuanVideo workflow uses a HunyuanVideo-specific guidance node similar to FluxGuidance. -->

---

## Latent upscaler

In `available-models.json` → `latent_upscale_models`. Load with `LatentUpscaleModelLoader`.

| Model | Notes |
|---|---|
| `hunyuanvideo15_latent_upsampler_1080p.safetensors` | HunyuanVideo 1.5 latent upscale to 1080p |
