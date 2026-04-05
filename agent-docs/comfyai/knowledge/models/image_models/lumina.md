# Lumina Image 2.0

Reference for Lumina Image 2.0, an open-source image generation model from Alpha-VLLM.

---

## Model variants

In `available-models.json` → `diffusion_models`. Load with `UNETLoader`.

| Filename | Notes |
|---|---|
| `lumina_image_2.0_bf16.safetensors` | Full model, bf16 (~2B) |
| `lumina_image_2.0_fp8_e4m3fn.safetensors` | fp8 quantized |

---

## Companion files

| Role | Filename | Category |
|---|---|---|
| Text encoder | `gemma-2-2b-it` or similar | `clip` |
| VAE | `sdxl_vae.safetensors` or `ae.safetensors` | `vae` |

<!-- TODO: Confirm exact text encoder and VAE. Lumina 2.0 uses a Gemma 2B instruction-tuned model as text encoder. The exact HuggingFace path and filename may require a custom CLIPLoader variant. -->

---

## Sampler settings

- Steps: 30–50
- CFG: 4.0–7.0
- Sampler: `euler`
- Scheduler: `simple`

<!-- TODO: Confirm settings — Lumina 2.0 uses flow matching similar to SD3/Flux. -->

---

## Notes

- Lumina 2.0 uses a Gemma 2B LLM as text encoder — requires a custom ComfyUI loader node
- Strong instruction-following capability from the LLM encoder
- Resolution: native 1024×1024, supports arbitrary aspect ratios
- Open-source, no gating — freely downloadable from HuggingFace (`Alpha-VLLM/Lumina-Image-2.0`)
- Check for a Lumina-specific custom node — the Gemma encoder may not work with standard CLIPLoader
