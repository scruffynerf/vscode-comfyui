# Stable Video Diffusion (SVD)

Reference for Stable Video Diffusion, Stability AI's image-to-video model. SVD generates short video clips from a single input image.

Also covers Stable Cascade, a separate high-quality image model.

---

## SVD variants

In `available-models.json` → `checkpoints`. Load with `CheckpointLoaderSimple`.

| Filename | Frames | Notes |
|---|---|---|
| `svd.safetensors` | 14 frames | Standard SVD |
| `svd_xt.safetensors` | 25 frames | Extended, higher quality |
| `svd_xt_1_1.safetensors` | 25 frames | v1.1 update |

SVD is an **image-to-video** model — it always takes an input image, not a text prompt.

---

## Basic SVD wiring

```
LoadImage → ImageOnlyCheckpointLoader (svd_xt.safetensors)
                ↓ MODEL, VAE, CLIP_VISION

CLIPVisionEncode (input image)
  ↓ CLIP_VISION_OUTPUT

SVD_img2vid_Conditioning
  ↓ positive / negative CONDITIONING

VideoLinearCFGGuidance
  ↓ MODEL (with guidance)

KSampler → VAEDecodeTiled → SaveAnimatedWEBP
```

---

## Sampler settings

| Variant | Steps | CFG | Sampler | Scheduler | Min CFG |
|---|---|---|---|---|---|
| SVD | 20–25 | 2.5 | `euler` | `karras` | 1.0 |
| SVD-XT | 25–30 | 2.5 | `euler` | `karras` | 1.0 |

SVD uses `VideoLinearCFGGuidance` to set a CFG schedule (start and end values) — CFG is not constant throughout sampling.

**Key parameters on SVD_img2vid_Conditioning:**
- `motion_bucket_id`: 0–255, controls motion intensity (127 = default, higher = more motion)
- `fps`: target frame rate in the conditioning (typically 6–8)
- `augmentation_level`: noise added to the input image (0 = exact input, 0.02–0.05 = slight variation)

---

## Output

SVD outputs video frames. Save with `SaveAnimatedWEBP` or `VHS_VideoCombine` (if VideoHelperSuite is installed). VAE decode should use `VAEDecodeTiled` to handle the tiled spatial encoding.

Resolution: SVD is tuned for 1024×576. Other resolutions may work but quality varies.

---

## Stable Cascade

A separate, distinct image generation model from Stability AI. High efficiency, operates at very compressed latents (1/42 compression vs 1/8 for standard SD).

In `available-models.json` → `checkpoints`:
- `stable_cascade_stage_c.safetensors` — Stage C (generates compressed latent)
- `stable_cascade_stage_b.safetensors` — Stage B (decodes compressed latent to image latent)

Requires two-stage sampling: Stage C → Stage B → VAEDecode. Uses `StableCascadeUnetLoader` in ComfyUI.

<!-- TODO: Confirm stable cascade wiring — the two-stage process requires specific ComfyUI nodes. -->
