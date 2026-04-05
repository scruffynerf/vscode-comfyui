# Mochi Preview

Reference for Mochi 1 Preview by Genmo. Open-weight video generation model.

---

## Model variants

In `available-models.json` → `diffusion_models`. Load with `UNETLoader`.

| Filename | Notes |
|---|---|
| `mochi_preview_bf16.safetensors` | Full model, bf16 |
| `mochi_preview_fp8_e4m3fn.safetensors` | fp8 quantized, reduced VRAM |

---

## Companion files

| Role | Filename | Category |
|---|---|---|
| VAE | `mochi_vae.safetensors` | `vae` |
| Text encoder | `t5xxl_fp16.safetensors` or `t5xxl_fp8_e4m3fn.safetensors` | `clip` |

Uses T5-XXL only (no CLIP-L).

---

## Sampler settings

- Steps: 64 (recommended) — Mochi requires more steps than Flux
- CFG: 4.5–6.0
- Sampler: `euler`
- Scheduler: `simple` or `linear`
- Resolution: 848×480 (standard), aspect ratios between 9:16 and 16:9 supported
- Frame count: 19–163 frames (multiples of 6 plus 1: 7, 13, 19, 25, ..., 163)

<!-- TODO: Verify exact step count recommendation and scheduler. Mochi is known to need more steps than typical video models. -->

---

## Notes

- Mochi emphasizes motion quality and smooth temporal consistency
- Uses a DiT (Diffusion Transformer) architecture
- Full bf16 requires ~22GB VRAM; fp8 runs on ~12GB
- Natural language prompts work well — designed for descriptive sentences
