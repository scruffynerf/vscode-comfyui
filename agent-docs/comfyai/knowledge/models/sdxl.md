# SDXL-Specific Patterns

Reference for working with SDXL models. Read this before building or modifying SDXL workflows.

Cross-references: `knowledge/models/model-settings.md` (sampler settings), `knowledge/prompting.md` (prompt style), `knowledge/models/vae.md` (fp16 fix VAE).

---

## SDXL vs SD1.5: key differences at a glance

| | SD 1.5 | SDXL |
|---|---|---|
| Native resolution | 512×512 | 1024×1024 |
| Text encoder | Single CLIP | Dual CLIP (CLIP-G + CLIP-L) |
| Prompt style | Tag-based | Hybrid (tags + phrases) |
| VAE | Bundled, usually fine | Bundled often has fp16 bug — use fp16 fix VAE |
| Refiner | No | Optional second model for final pass |

---

## VAE

The VAE bundled with most SDXL checkpoints has a known fp16 precision issue that produces gray or washed-out output on some hardware. **Always load the SDXL fp16 fix VAE** unless you are certain your checkpoint has it baked in:

- `sdxl_vae.safetensors` or `sdxl-vae-fp16-fix.safetensors`
- Load with `VAELoader`, wire to `VAEDecode` and `VAEEncode`

See `knowledge/models/vae.md` for full VAE guidance.

---

## Dual CLIP text encoders

SDXL uses two CLIP encoders simultaneously:
- **CLIP-G (OpenCLIP ViT-bigG)**: the larger encoder, more influence on composition and style
- **CLIP-L (CLIP ViT-L)**: the smaller encoder, similar to SD1.5's encoder

For most workflows, `CLIPTextEncode` handles both automatically — you write one prompt, it encodes through both.

For finer control, use `CLIPTextEncodeSDXL` which exposes separate inputs:
- `text_g`: prompt for CLIP-G — affects broad composition, subject, style
- `text_l`: prompt for CLIP-L — affects detail-level tokens

**When to use `CLIPTextEncodeSDXL`:**
- When you want different levels of description for each encoder
- Typical pattern: `text_g` = full descriptive phrase, `text_l` = key style/detail tags
- For most tasks, regular `CLIPTextEncode` with a single prompt is sufficient

---

## Aesthetic score inputs

`CLIPTextEncodeSDXL` also exposes `width`, `height`, `crop_w`, `crop_h`, `target_width`, `target_height`, and `aesthetic_score` inputs. These correspond to SDXL's training conditioning.

Practical defaults:
- `width` / `height`: match your `EmptyLatentImage` dimensions (e.g. 1024×1024)
- `target_width` / `target_height`: same as width/height
- `crop_w` / `crop_h`: 0 (no crop)
- `aesthetic_score` (positive): 6.0 — signals "high quality image"
- `aesthetic_score` (negative): 2.5 — signals "low quality, reject this"

These are optional — the model generates fine without them. They subtly nudge output quality and can help with very short prompts.

---

## Base + refiner workflow

SDXL was designed as a two-model pipeline: a **base** model for initial generation and a **refiner** model for final detail enhancement.

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

The base and refiner models share the same positive/negative conditioning. The refiner uses the same CLIP encoders as the base — wire them from the base checkpoint outputs.

### Is the refiner worth it?

The refiner adds significant memory overhead (two full SDXL models loaded). Whether it improves results depends on the task:

- **Worth it for:** portraits, fine detail, face quality, photorealistic output
- **Often not worth it for:** abstract art, heavily stylized output, concept exploration
- **Alternative:** skip the refiner, run base at 30–35 steps with hires fix — often comparable quality with less VRAM

If VRAM is constrained (< 16GB), run base only + hires fix rather than base + refiner.

---

## Resolution

SDXL's native resolution is 1024×1024. Use the standard aspect ratio dimensions:

| Aspect | Dimensions |
|---|---|
| 1:1 | 1024×1024 |
| 2:3 portrait | 832×1216 |
| 3:2 landscape | 1216×832 |
| 16:9 | 1280×720 |

See `knowledge/resolution.md` for the full table.

---

## Sampler settings

- Steps: 20–30
- CFG: 5–7 (range 4–9 is safe)
- Sampler: `dpmpp_2m_karras` (standard), `euler` also works well
- Scheduler: `karras`

See `knowledge/models/model-settings.md`.

---

## LoRAs on SDXL

SDXL LoRAs behave more subtly than SD1.5 — often require higher strength (0.8–1.2) to show clearly. Some LoRAs are trained for base only and don't work with the refiner. See `knowledge/loras-stacking.md`.

---

## Common mistakes

- Using SD1.5 LoRAs on SDXL (incompatible architectures — will error or produce garbage)
- Not using the fp16 fix VAE (gray/washed output)
- Running at 512×512 (SDXL underperforms significantly below its native resolution)
- Loading the refiner for every workflow regardless of need (VRAM cost often not justified)
- Sending different conditioning to base and refiner (they should share the same CLIP/prompt)
