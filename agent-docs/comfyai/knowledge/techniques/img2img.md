# Img2Img

> Your notes: comfyai/wiki/ (persists across updates)

Task doc for image-to-image workflows. Read through before wiring. For inpainting (masked edits), see `knowledge/inpainting.md`.

---

## The core idea

In txt2img: `noise → image`

In img2img: `existing image → VAEEncode → partially noised latent → regenerated`

You control how much of the original survives with **denoise strength**. The image provides structure; the prompt provides direction.

---

## Wiring

```
LoadImage
  ↓
VAEEncode              ← requires VAE from checkpoint
  ↓
KSampler (denoise < 1.0)
  ↓
VAEDecode
  ↓
SaveImage
```

`VAEEncode` replaces `EmptyLatentImage`. The encoded latent feeds the same KSampler inputs (MODEL, positive/negative CONDITIONING still come from your checkpoint + CLIP nodes).

---

## Denoise strength

The most important parameter. Controls how much of the original image is destroyed and rebuilt.

| Denoise | Effect | Use for |
|---|---|---|
| 0.0–0.3 | Original mostly preserved — minor color shifts, subtle detail | Polishing, fixing artifacts, slight stylization |
| 0.4–0.7 | Structure intact, style and details can change significantly | Restyling (photo → painting), anatomy improvement, adding detail |
| 0.7–0.9 | Composition starts to drift, major changes possible | Redesigning parts, creative reinterpretation |
| 1.0 | Full regeneration — original effectively ignored | Equivalent to txt2img with a faint structural hint |

**Rule:** at low denoise, the prompt has less power. At high denoise, the prompt dominates. Scale your prompt specificity accordingly.

---

## Prompting in img2img

The prompt is direction, not definition. The image provides the base definition.

- Low denoise: prompt guides tone and style tweaks
- High denoise: prompt becomes the primary driver — write it as if for txt2img
- You do not need to "describe the existing image" in the prompt — just describe what you want it to become

---

## Resolution note

Match the output resolution to the input image dimensions. If you resize the image before VAEEncode, use `ImageScale` or `ImageResize` first. Mismatched resolution can cause composition artifacts.

---

## Common mistakes

- Forgetting `VAEEncode` (the pipeline will error or produce noise)
- Setting denoise to 1.0 unintentionally — the source image is then irrelevant
- Expecting low denoise to follow a strong prompt — it won't; structure wins at low values
- Using a resolution that doesn't match the loaded image dimensions
