# SDXL Models

> Your notes: comfyai/wiki/ (persists across updates)

## Quick Summary
- **Load**: `CheckpointLoaderSimple` + separate fp16 VAE
- **Resolution**: 1024×1024 native
- **Prompt**: tags + descriptive phrases (hybrid)
- **Sampler**: 20-30 steps, DPM++ 2M, CFG 5-8
- **Refiner**: optional second-pass with refiner model

---

## Full Reference

Reference for SDXL and community checkpoints built on it (Juggernaut XL, RealVisXL, etc.).

For SD 1.5 (the older 512×512 architecture), see [sd15.md](sd15.md).
For SDXL-based community flavors with specific training, see [pony.md](pony.md) and [illustrious.md](illustrious.md).

Cross-references: `knowledge/prompting.md` (prompt style), `knowledge/models/vae.md` (VAE troubleshooting).

---

## Architecture overview

- Native resolution: 1024×1024
- Text encoders: dual CLIP (CLIP-G + CLIP-L)
- Prompt style: hybrid (tags + descriptive phrases)
- VAE: bundled, but often has fp16 precision bug — always load the fp16 fix VAE separately
- Load with `CheckpointLoaderSimple` (AIO)

---

## VAE

The VAE bundled with most SDXL checkpoints has a known fp16 precision issue that produces gray or washed-out output on some hardware. **Always load the SDXL fp16 fix VAE** unless you are certain your checkpoint has it baked in:

- `sdxl_vae.safetensors` or `sdxl-vae-fp16-fix.safetensors`
- Load with `VAELoader`, wire to `VAEDecode` and `VAEEncode`

Some "baked VAE" checkpoint variants already include the fix — check before adding a separate loader. For gray output troubleshooting, see `knowledge/models/vae.md`.

---

## Dual CLIP text encoders

SDXL uses two CLIP encoders simultaneously:
- **CLIP-G (OpenCLIP ViT-bigG)**: the larger encoder, more influence on composition and style
- **CLIP-L (CLIP ViT-L)**: the smaller encoder

For most workflows, `CLIPTextEncode` handles both automatically — you write one prompt, it encodes through both.

For finer control, use `CLIPTextEncodeSDXL` which exposes separate inputs:
- `text_g`: prompt for CLIP-G — affects broad composition, subject, style
- `text_l`: prompt for CLIP-L — affects detail-level tokens

**When to use `CLIPTextEncodeSDXL`:**
- Typical pattern: `text_g` = full descriptive phrase, `text_l` = key style/detail tags
- For most tasks, regular `CLIPTextEncode` with a single prompt is sufficient

---

## Aesthetic score inputs

`CLIPTextEncodeSDXL` exposes `width`, `height`, `crop_w`, `crop_h`, `target_width`, `target_height`, and `aesthetic_score` inputs corresponding to SDXL's training conditioning.

Practical defaults:
- `width` / `height`: match your `EmptyLatentImage` dimensions (e.g. 1024×1024)
- `target_width` / `target_height`: same as width/height
- `crop_w` / `crop_h`: 0
- `aesthetic_score` (positive): 6.0
- `aesthetic_score` (negative): 2.5

These are optional — they subtly nudge quality and can help with very short prompts.

---

## Base + refiner workflow

SDXL was designed as a two-model pipeline: a **base** model for initial generation and a **refiner** for final detail enhancement.

```
CheckpointLoaderSimple (SDXL base)
  ↓
KSampler — Base pass
  · Steps: 20–25
  · Denoise: 1.0
  · end_at_step: ~18  (stop before final steps)
  ↓ LATENT
CheckpointLoaderSimple (SDXL refiner)  ← separate model load
  ↓
KSamplerAdvanced — Refiner pass
  · add_noise: false
  · start_at_step: 18  (picks up where base stopped)
  · Steps: 20–25 total
  · Denoise: ~0.3–0.4
  ↓
VAEDecode → SaveImage
```

The base and refiner share the same positive/negative conditioning. The refiner uses the same CLIP encoders as the base — wire them from the base checkpoint outputs.

### Is the refiner worth it?

- **Worth it for:** portraits, fine detail, face quality, photorealistic output
- **Often not worth it for:** abstract art, heavily stylized output, concept exploration
- **Alternative:** skip the refiner, run base at 30–35 steps with hires fix — often comparable quality with less VRAM

If VRAM is constrained (< 16GB), run base only + hires fix.

---

## Resolution

Native 1024×1024. Standard aspect ratio dimensions:

| Aspect | Dimensions |
|---|---|
| 1:1 | 1024×1024 |
| 2:3 portrait | 832×1216 |
| 3:2 landscape | 1216×832 |
| 16:9 | 1280×720 |

---

## Sampler settings

- Steps: 20–30
- CFG: 5–7 (range 4–9 is safe)
- Sampler: `dpmpp_2m`
- Scheduler: `karras`

---

## LoRAs

SDXL LoRAs behave more subtly than SD1.5 — often require higher strength (0.8–1.2) to show clearly. Some LoRAs are trained for base only and don't work with the refiner. See `knowledge/loras-stacking.md`.

---

## Common mistakes

- Using SD1.5 LoRAs on SDXL (incompatible architectures — will error or produce garbage)
- Not using the fp16 fix VAE (gray/washed output)
- Running at 512×512 (SDXL underperforms significantly below its native resolution)
- Loading the refiner for every workflow regardless of need (VRAM cost often not justified)
- Sending different conditioning to base and refiner (they should share the same CLIP/prompt)

---

## IP-Adapter models

Requires: ComfyUI-IPAdapter-plus custom node. Load with `IPAdapterModelLoader`.
Also needs a `CLIPVisionLoader` — see `available-models.json` → `clip_vision`.

**CLIP Vision for SDXL**: `CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors`.

| Model | Notes |
|---|---|
| `ip-adapter_sdxl.safetensors` | Standard SDXL |
| `ip-adapter_sdxl_vit-h.safetensors` | ViT-H backbone |
| `ip-adapter-plus_sdxl_vit-h.safetensors` | Plus, stronger image influence |
| `ip-adapter-plus-face_sdxl_vit-h.safetensors` | Face-optimized SDXL |

### FaceID models

| Model | Notes |
|---|---|
| `ip-adapter-faceid_sdxl.bin` | Standard FaceID |
| `ip-adapter-faceid-plusv2_sdxl.bin` | FaceID + style v2 |
| `ip-adapter-faceid-portrait_sdxl.bin` | Multiple reference images |

Also needs a companion **FaceID LoRA** in `available-models.json` → `loras`.

---

## ControlNet models

Load with `ControlNetLoader` → `ControlNetApply` or `ControlNetApplyAdvanced`.

SDXL ControlNets are sparser than SD 1.5 — fewer community options.

| Model | Guidance type |
|---|---|
| `OpenPoseXL2.safetensors` | Human pose |
| `control-lora-openposeXL2-rank256.safetensors` | Human pose (LoRA rank256) |
