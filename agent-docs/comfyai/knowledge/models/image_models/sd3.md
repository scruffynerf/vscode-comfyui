# SD3 / SD3.5 Models

Reference for Stable Diffusion 3 and 3.5 from Stability AI. All require a HuggingFace account with accepted terms — set `HF_TOKEN` before first use.

For VAE troubleshooting (gray output, precision issues): `knowledge/models/vae.md`.

---

## Model variants

**SD3 Medium** (~2B):
- In `available-models.json` → `checkpoints` (AIO): `sd3_medium_incl_clips_t5xxlfp8.safetensors`
- Or in `diffusion_models` (split weights): `sd3_medium.safetensors`

**SD3.5 Large** (~8B):
- `sd3.5_large.safetensors` — in `diffusion_models`, needs separate CLIP + VAE

**SD3.5 Large Turbo** (~8B, distilled):
- `sd3.5_large_turbo.safetensors` — in `diffusion_models`, 4–8 steps

**SD3.5 Medium** (~2.5B):
- `sd3.5_medium.safetensors` — in `diffusion_models`

---

## AIO vs split-weights loading

The AIO checkpoint (`sd3_medium_incl_clips_t5xxlfp8.safetensors`) bundles CLIP-L, CLIP-G, and T5 — use `CheckpointLoaderSimple` and you're done.

The split-weights versions need `TripleCLIPLoader`:

```
UNETLoader (sd3.5_large.safetensors)
  ↓ MODEL

TripleCLIPLoader
  (clip_l.safetensors, clip_g.safetensors, t5xxl_fp8_e4m3fn.safetensors)
  ↓ CLIP

VAELoader (sd3.5_vae.safetensors)
  ↓ VAE
```

---

## Companion files

| Role | Filename | Category |
|---|---|---|
| VAE | `sd3.5_vae.safetensors` | `vae` |
| CLIP-L | `clip_l.safetensors` | `clip` |
| CLIP-G | `clip_g.safetensors` | `clip` |
| T5-XXL fp8 | `t5xxl_fp8_e4m3fn.safetensors` | `clip` |

`TripleCLIPLoader` takes `clip_l`, `clip_g`, and `t5xxl` in that order.

---

## Sampler settings

| Variant | Steps | CFG | Sampler | Scheduler |
|---|---|---|---|---|
| SD3 Medium | 28 | 4.5–7 | `euler` | `simple` |
| SD3.5 Large | 28 | 3.5–4.5 | `euler` | `simple` |
| SD3.5 Large Turbo | 4–8 | 1.0 | `euler` | `simple` |
| SD3.5 Medium | 28 | 4.5 | `euler` | `simple` |

SD3 uses the same guidance embedding approach as Flux — use `ModelSamplingSD3` node or set low CFG on the sampler. Do not use high CFG values.

---

## HuggingFace auth

All SD3/SD3.5 models are gated. Accept terms at:
- `stabilityai/stable-diffusion-3-medium`
- `stabilityai/stable-diffusion-3.5-large`
- `stabilityai/stable-diffusion-3.5-large-turbo`
- `stabilityai/stable-diffusion-3.5-medium`

Then set `HF_TOKEN` before starting the server. See `hiddenswitch/reference/models.md` → Gated models.

---

## Prompting

SD3/SD3.5 uses three encoders simultaneously:
- CLIP-L: style/token-level signal
- CLIP-G: larger CLIP (SDXL-style)
- T5-XXL: long-context natural language

Write natural language prompts (not tag lists). Both positive and negative prompts are supported. The T5 encoder handles long, descriptive sentences well.
