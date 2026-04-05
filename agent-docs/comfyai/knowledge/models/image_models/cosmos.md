# Cosmos Models

Reference for NVIDIA Cosmos video and image generation models.

---

## Cosmos 1.0 (text-to-video and image-to-video)

In `available-models.json` → `diffusion_models`. Load with `UNETLoader`.

| Filename | Type | Notes |
|---|---|---|
| `Cosmos-1.0-Diffusion-7B-Text2World.safetensors` | t2v | 7B, text-to-video |
| `Cosmos-1.0-Diffusion-14B-Text2World.safetensors` | t2v | 14B, highest quality |
| `Cosmos-1.0-Diffusion-7B-Video2World.safetensors` | i2v/v2v | 7B, image/video to video |
| `Cosmos-1.0-Diffusion-14B-Video2World.safetensors` | i2v/v2v | 14B |

---

## Cosmos Predict2

Newer generation with improved quality and speed.

| Filename | Notes |
|---|---|
| `Cosmos-Predict2-2B-Text2Image.safetensors` | 2B text-to-image |
| `Cosmos-Predict2-2B-Text2World.safetensors` | 2B text-to-video |
| `Cosmos-Predict2-14B-Text2World.safetensors` | 14B text-to-video |

<!-- TODO: Confirm exact filenames for Cosmos Predict2 — naming may vary by release. -->

---

## Companion files

| Role | Filename | Category |
|---|---|---|
| VAE | `cosmos_vae.safetensors` | `vae` |
| Text encoder | `OldCosmos_encoder.safetensors` or T5-XXL | `clip` |

<!-- TODO: Verify exact VAE and text encoder filenames for Cosmos. Cosmos 1.0 uses a custom text encoder (Cosmos-Tokenizer). Predict2 may use T5-XXL. -->

---

## Sampler settings

<!-- TODO: Confirm sampler settings for Cosmos — the model uses a flow-matching approach. -->

- Steps: 30–50
- CFG: 7.0
- Sampler: `euler`
- Scheduler: `simple`

---

## Notes

- Cosmos 1.0 requires NVIDIA GPU (trained on H100). Apple Silicon compatibility unconfirmed.
- HuggingFace gated: accept terms at `nvidia/Cosmos-1.0-Diffusion-7B-Text2World` etc.
- Cosmos Tokenizer is a custom text tokenizer (not T5 or CLIP) — may require a specific custom node
- Check `comfyai/nodes/node-registry.json` for available Cosmos-specific nodes after installing the relevant custom node
