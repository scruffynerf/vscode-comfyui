# Inpainting

Task doc for masked editing. Read through before wiring. For whole-image transformation without a mask, see `knowledge/img2img.md` first — inpainting builds on the same foundation.

---

## The core idea

Inpainting is img2img with a mask. The mask tells the model *where* to apply changes. Everything outside the mask is preserved.

---

## Wiring

```
LoadImage
LoadImage (mask) — or any MASK output
  ↓
VAEEncode
  ↓
SetLatentNoiseMask    ← connects both the latent and the mask
  ↓
KSampler (denoise set by edit intensity)
  ↓
VAEDecode
  ↓
SaveImage
```

---

## Mask conventions

- **White = regenerate** (noise applied here)
- **Black = preserve** (untouched)

Some nodes invert this — verify before running. If an edit appears in the wrong area, invert your mask.

---

## SetLatentNoiseMask — why it matters

Without it: noise is applied to the whole latent; mask influence is indirect and causes "bleeding" changes outside the masked region.

With it: noise is applied only inside the mask boundary, producing precise edits with clean edges.

**Always use `SetLatentNoiseMask` for true inpainting.** Skip it only for soft blends where you intentionally want changes to bleed outside the mask.

---

## Denoise by edit type

| Denoise | Task |
|---|---|
| 0.2–0.4 | Small corrections — fix an eye, remove an artifact, clean up a detail |
| 0.5–0.7 | Rebuild the masked area while respecting surrounding context |
| 0.8–1.0 | Full replacement — treat masked area as new generation; risk of context mismatch |

---

## Edge blending and seam issues

Visible seams between edited and original areas are caused by:
- Hard mask edges
- High denoise (0.7+)
- Lighting or color mismatch between generated content and surroundings

Fixes:
- Blur the mask edge slightly before feeding it in (soft mask boundary)
- Lower denoise
- Write a prompt that describes the surrounding context, not just the subject of the edit
- Use ControlNet for structural consistency across the seam

---

## Common patterns

**Fix faces:** mask face → denoise 0.4–0.6 → prompt: describe a detailed face

**Replace an object:** mask object → denoise 0.7–0.9 → strong prompt describing the replacement

**Remove something:** mask the area → denoise 0.6–0.8 → prompt: describe what should fill that space (background, continuation of scene)

**Outpainting:** extend canvas, mask the new empty area → denoise ~0.9 → describe the scene extension

---

## Mask sources

- **Manual:** painted in an external tool. White = edit zone, black = preserve.
- **Segmentation nodes:** Impact Pack or similar — detect objects, people, faces and output a mask automatically.
- **Node-generated:** threshold by color, luminance, or bounding box.
- **Inverted from another mask:** `MaskToImage` + invert + `ImageToMask` if needed.

---

## Common mistakes

- Skipping `SetLatentNoiseMask` → edits bleed outside the mask
- Hard mask edges with high denoise → visible seam
- Denoise too high → generated content ignores surrounding context, looks pasted
- Mask convention inverted → edits appear in wrong areas
