# HiDream-I1

Reference for HiDream-I1, a high-resolution image generation model.

---

## Model variants

In `available-models.json` → `diffusion_models`. Load with `UNETLoader`.

| Filename | Notes |
|---|---|
| `hidream_i1_full_bf16.safetensors` | Full model, bf16 (~17B) |
| `hidream_i1_fast_bf16.safetensors` | Fast distilled variant |
| `hidream_i1_dev_bf16.safetensors` | Dev/experimental variant |

fp8 quantized versions exist for reduced VRAM.

---

## Companion files

HiDream uses a quad-encoder setup: CLIP-L, CLIP-G, T5-XXL, and LLaMA 3.1.

| Role | Filename | Category |
|---|---|---|
| CLIP-L | `clip_l.safetensors` | `clip` |
| CLIP-G | `clip_g.safetensors` | `clip` |
| T5-XXL | `t5xxl_fp8_e4m3fn.safetensors` | `clip` |
| LLaMA 3.1 8B | (custom download) | — |
| VAE | `hidream_vae.safetensors` or `ae.safetensors` | `vae` |

<!-- TODO: Confirm exact VAE filename and whether the Flux VAE (ae.safetensors) is compatible with HiDream. Also confirm LLaMA 3.1 path and whether it needs a HuggingFace gate. -->

---

## Sampler settings

| Variant | Steps | CFG | Sampler | Scheduler |
|---|---|---|---|---|
| Full | 50 | 5.0 | `euler` | `simple` |
| Fast | 16 | 3.5 | `euler` | `simple` |

---

## Notes

- HiDream-I1 is a large model (~17B) — requires 24GB+ VRAM for bf16, or use fp8
- LLaMA 3.1 text encoder is gated: accept terms at `meta-llama/Llama-3.1-8B-Instruct` on HuggingFace
- Supports very high resolution outputs (2048×2048 and beyond)
- Check for a HiDream-specific custom node in the ComfyUI registry for correct wiring
