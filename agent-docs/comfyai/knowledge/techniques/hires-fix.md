# Hires Fix (Two-Pass Upscale)

> Your notes: comfyai/wiki/ (persists across updates)

Task doc — read it through before wiring. This pattern produces sharp high-resolution output without the artifacts of generating at large sizes directly.

---

## Why not just generate at high resolution?

Generating SD1.5 at 1024 or SDXL at 1536+ directly often produces duplicated subjects, broken anatomy, and fragmented composition. The model was trained at a specific scale — generating larger forces it to fill multiple "expected compositions" into one canvas.

The fix: generate at native resolution first to establish composition, then scale and refine.

---

## The wiring

```
EmptyLatentImage (native res, e.g. 1024×1024 for SDXL)
  ↓
KSampler — Pass 1 (full denoise = 1.0)
  ↓
LatentUpscale (1.5x–2x)
  ↓
KSampler — Pass 2 (low denoise = 0.45–0.55)
  ↓
VAEDecode
  ↓
SaveImage
```

Both KSamplers share the same MODEL, positive CONDITIONING, and negative CONDITIONING from the checkpoint + CLIP nodes. No new prompt encoding needed for pass 2.

---

## Pass 1 settings

- Resolution: native for your model (see `knowledge/resolution.md`)
- Steps: 20–30
- CFG: normal for the model family
- Denoise: 1.0 (full generation from noise)
- Sampler: anything — euler, dpmpp_2m_karras

---

## Latent upscale

- Upscale the latent, not the decoded image
- `LatentUpscale` node: method = `bilinear` or `nearest-exact`, scale to target dimensions
- Recommended scale factors: **1.5x** (safe) to **2x** (standard). Above 2x risks instability.
- SDXL example: 1024×1024 → 1536×1536 (1.5x) or 2048×2048 (2x)

---

## Pass 2 settings

- Steps: 15–25 (fewer than pass 1 is fine)
- CFG: same or slightly lower than pass 1
- Denoise: **0.45–0.55** — this is the key parameter

### Denoise guide for pass 2

| Denoise | Effect |
|---|---|
| 0.2–0.3 | Subtle sharpening only — minimal new detail |
| 0.45–0.55 | **Standard hires fix range** — adds detail, improves texture, preserves structure |
| 0.7+ | Composition starts to drift — you're doing img2img, not refinement |

Sampler: `dpmpp_2m_karras` is the standard choice for pass 2.

---

## Alternative: image upscale + re-encode

For extreme resolutions or specific detail enhancement, you can decode after pass 1, upscale with an ESRGAN model, then re-encode and do pass 2:

```
KSampler Pass 1 → VAEDecode → UpscaleModelLoader + ImageUpscaleWithModel → VAEEncode → KSampler Pass 2
```

This is heavier but sometimes produces better results at very large output sizes.

---

## Common mistakes

- Denoise too high in pass 2 (≥0.7) → composition breaks, looks like separate generation
- Upscale factor > 2x → instability
- Forgetting to share conditioning from pass 1 (re-encoding the same prompt is fine, just unnecessary)
- Using a different sampler in pass 2 that conflicts with pass 1 expectations
