# Chroma Models

Reference for Chroma, a Flux-derived image model with an unconditional (no-text) architecture.

---

## What Chroma is

Chroma is a distilled, fine-tuned variant of Flux Dev that removes the text encoder dependency entirely. It does not use CLIP-L or T5-XXL — instead it uses a custom conditioning mechanism. It is designed for use with structured prompts or style conditioning, not free-form natural language.

---

## Model variants

In `available-models.json` → `diffusion_models`. Load with `UNETLoader`.

| Filename | Notes |
|---|---|
| `chroma-unlocked.safetensors` | Standard Chroma |
| `chroma-unlocked-v35.safetensors` | v35 update |
| `chroma-unlocked-v35-8bit.gguf` | GGUF quantized for lower VRAM |

<!-- TODO: Confirm exact filenames — Chroma releases may use different naming. -->

---

## Wiring: no CLIP, no VAE replacement

Chroma still uses the **Flux VAE** (`ae.safetensors`). It does NOT need a CLIP loader.

```
UNETLoader (chroma-unlocked.safetensors)
  ↓ MODEL

ChromaTextEncode (or similar custom node)
  ↓ CONDITIONING

VAELoader (ae.safetensors)
  ↓ VAE

EmptyLatentImage → KSampler → VAEDecode → SaveImage
```

<!-- TODO: Confirm the conditioning node name. Chroma may require a specific custom node for its conditioning. If no custom node is installed, check whether a standard CLIPTextEncode with an empty string works as a passthrough. -->

---

## Sampler settings

- Steps: 8–20
- CFG: 1.0 (guidance-free like Flux Schnell)
- Sampler: `euler`
- Scheduler: `simple`

---

## Notes

- Chroma is for users who want Flux-quality output without text prompting — it's style/structure conditioned
- The VAE is the same Flux VAE (`ae.safetensors`)
- VRAM requirements are similar to Flux fp8 (~12–16GB for standard, ~8GB for GGUF)
