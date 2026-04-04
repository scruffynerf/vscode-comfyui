# Flux-Specific Patterns

Reference for working with Flux models. Flux differs from SD1.5 and SDXL in architecture, loading, prompting, and sampling. Read this before building or modifying any Flux workflow.

Cross-references: `knowledge/models/model-settings.md` (sampler settings), `knowledge/prompting.md` (prompt style), `knowledge/models/vae.md` (VAE requirements).

---

## Model types: AIO vs diffusion-only

Flux comes in two forms:

| Type | Description | How to load |
|---|---|---|
| AIO checkpoint (community merge) | MODEL + CLIP + VAE bundled | `CheckpointLoaderSimple` |
| Diffusion-only base weights (official BFL release) | MODEL only — no CLIP, no VAE | `UNETLoader` + separate CLIP + VAE |

The official black-forest-labs releases (`flux1-dev.safetensors`, `flux1-schnell.safetensors`) are diffusion-only. Do not attempt to load them with `CheckpointLoaderSimple` alone — the workflow will error.

FP8 quantized versions (`flux1-dev-fp8.safetensors`) are also diffusion-only and load the same way.

---

## Full Flux wiring (diffusion-only)

```
UNETLoader (flux1-dev.safetensors or flux1-dev-fp8.safetensors)
  ↓ MODEL

DualCLIPLoader (clip_l.safetensors + t5xxl_fp16.safetensors)
  ↓ CLIP

CLIPTextEncode (positive prompt)
  ↓ CONDITIONING

FluxGuidance (guidance value ~3.5)    ← appends guidance embedding to conditioning
  ↓ CONDITIONING

VAELoader (ae.safetensors)
  ↓ VAE

EmptyLatentImage
  ↓ LATENT

KSampler or SamplerCustomAdvanced
  ↓ LATENT

VAEDecode → SaveImage
```

---

## Dual CLIP encoders: T5 and CLIP-L

Flux uses two text encoders simultaneously:

- **T5-XXL**: long-context, natural language understanding — this is what makes Flux respond well to descriptive sentences
- **CLIP-L**: the same CLIP encoder used in SD1.5 — contributes style/token-level signal

Both are loaded via `DualCLIPLoader`. Common file names:
- CLIP-L: `clip_l.safetensors`
- T5-XXL fp16: `t5xxl_fp16.safetensors` (~10GB)
- T5-XXL fp8 (quantized, smaller): `t5xxl_fp8_e4m3fn.safetensors` (~5GB)

Use fp8 T5 if VRAM or memory is constrained — quality difference is minor. Use fp16 for maximum fidelity.

---

## FluxGuidance node

Flux does not use CFG in the traditional sense — it uses a **guidance embedding** baked into the conditioning. This is done with the `FluxGuidance` node, which appends a guidance value to the positive conditioning before sampling.

- Typical range: **2.5–4.5**
- `3.5` is the standard starting point
- Higher values: stronger prompt adherence, risk of oversaturation
- Lower values: softer, more interpretive

Do not set a high CFG value on the KSampler when using Flux — use CFG 1.0 on the sampler and control guidance via `FluxGuidance` instead.

---

## Sampler settings

| Variant | Steps | Sampler | Scheduler | Notes |
|---|---|---|---|---|
| Flux Schnell | 1–4 | `euler` | `simple` | Distilled. Steps > 4 waste compute. |
| Flux Dev | 20–30 | `euler` | `simple` | More steps = higher fidelity |

See `knowledge/models/model-settings.md` for full model settings table.

---

## FP8 vs FP16

| Format | VRAM use | Quality | Notes |
|---|---|---|---|
| FP16 (full) | ~24GB for dev | Highest | Requires high-end GPU or Apple Silicon with sufficient unified memory |
| FP8 (quantized) | ~12–16GB | Near-identical in practice | Recommended for most hardware |
| NF4 / GGUF | ~8GB | Slight quality reduction | For constrained hardware |

On Apple Silicon with `--novram`: FP8 is the practical default. FP16 may work on M2 Ultra / M3 Max+ with 64GB+ unified memory.

---

## Negative prompts

Flux largely ignores negative prompts. The model was not trained with classifier-free guidance in the same way as SD1.5/SDXL. Instead:

- Describe what you want, not what you don't want
- Bad: negative prompt `blurry, bad anatomy`
- Good: positive prompt `sharp focus, accurate anatomy, high detail`

Wiring a `ConditioningZeroOut` to the negative conditioning input is the standard approach — see `knowledge/workflow-patterns.md`.

---

## Prompting

Flux expects natural language sentences, not tag-style lists. See `knowledge/prompting.md` for full guidance and examples.

---

## LoRAs on Flux

Many Flux LoRAs are model-only (UNet only) — CLIP strength has no effect. Start at 0.5–0.7 strength. See `knowledge/loras.md` and `knowledge/loras-stacking.md`.

---

## Common mistakes

- Loading official Flux weights with `CheckpointLoaderSimple` (diffusion-only — use `UNETLoader`)
- Using SDXL or SD1.5 VAE with Flux (must use `ae.safetensors`)
- Setting CFG > 2 on the KSampler — use `FluxGuidance` for guidance control
- Using tag-style prompts — Flux responds to natural language
- Running Flux Schnell at 20 steps — 4 is correct, more wastes compute and can degrade quality
- Stacking the wrong CLIP files — Flux needs T5-XXL + CLIP-L, not the dual-CLIP from SDXL
