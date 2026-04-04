# ControlNet Setup

Task doc. Read through before wiring. ControlNet adds structural control (pose, depth, edges, etc.) to a generation by conditioning the model on a reference image.

---

## The wiring

```
LoadImage (reference image)
  ↓
[Preprocessor node]       ← converts image to the control signal format
  ↓
ControlNetLoader          ← loads the matching ControlNet model
  ↓
ControlNetApply           ← takes: conditioning, image (preprocessed), control_net, strength
  ↓  (outputs modified conditioning)
KSampler (positive input)
```

The preprocessor and `ControlNetApply` sit between your `CLIPTextEncode` and `KSampler`. The modified conditioning replaces the positive conditioning input on KSampler.

---

## Preprocessor → ControlNet model matching

The preprocessor must match the ControlNet model it feeds. Mismatches produce garbled or ignored control.

| Control type | Preprocessor | ControlNet model file |
|---|---|---|
| Human pose | `DWPose` or `OpenPose` | `control_openpose` / `control_v11p_sd15_openpose` |
| Depth | `MiDaS` or `DepthAnything` | `control_depth` / `control_v11f1p_sd15_depth` |
| Canny edges | `Canny` | `control_canny` / `control_v11p_sd15_canny` |
| Line art / soft edges | `SoftEdge_HED` or `LineArt` | `control_softedge` / `control_lineart` |
| Scribble / sketch | `Scribble` | `control_scribble` |
| Normal map | `NormalBae` | `control_normalbae` |
| Segmentation map | `Segmentation (OneFormer)` | `control_seg` |
| Shuffle / style reference | No preprocessor — use image directly | `control_shuffle` |
| IP-Adapter (style/face) | No preprocessor | separate IP-Adapter loader (not ControlNet) |

For SDXL: use SDXL-specific ControlNet weights (`controlnet-canny-sdxl`, etc.) — SD1.5 ControlNet models do not work on SDXL.

---

## Key parameters

**Strength (0.0–2.0, typical range 0.5–1.2):**
- How strongly the structural control overrides sampling
- 0.5–0.8: subtle structural influence, prompt retains more control
- 1.0: standard balanced control
- 1.2+: strong structural enforcement, can fight the prompt and produce artifacts

**Start percent / End percent:**
- Controls which portion of the sampling steps the ControlNet is active
- Default: 0.0 → 1.0 (entire run)
- `0.0 → 0.6`: active in early steps (establishes structure, allows detail to form freely later) — common choice
- `0.2 → 0.8`: skip the very first rough steps and the very last refinement steps
- Reducing end percent often improves texture quality at the cost of some structural precision

---

## Stacking multiple ControlNets

Use `ControlNetApply` sequentially — each node's output conditioning feeds the next:

```
CLIPTextEncode (positive)
  ↓
ControlNetApply (pose, strength 0.8)
  ↓
ControlNetApply (depth, strength 0.6)
  ↓
KSampler (positive)
```

Or use `ConditioningCombine` if you prefer to merge conditioning branches before the sampler.

Rules for stacking:
- Total effective influence adds up — use lower individual strengths when stacking (e.g. 0.6 + 0.5 rather than 1.0 + 1.0)
- Controls that conflict spatially (e.g. two different pose signals) produce unstable output — use controls that are complementary (pose + depth works well)
- More than 2–3 ControlNets rarely improves results and increases compute cost

---

## When to preprocess vs use image directly

Most ControlNet types require a preprocessor to extract the control signal from a photo or render. If you already have a preprocessed image (e.g. a depth map you created externally, or a pose skeleton image), skip the preprocessor and feed it directly to `ControlNetApply`.

`AIO_Preprocessor` (from ControlNet Aux) can auto-detect and apply the right preprocessor — useful for quick setup but less predictable than explicit selection.

---

## Common mistakes

- Feeding an unprocessed photo directly to a pose or depth ControlNet — the model receives RGB pixels instead of a control signal
- Using SD1.5 ControlNet weights with an SDXL checkpoint (or vice versa)
- Strength too high (1.5+) causing the ControlNet to fight the diffusion and produce artifacts
- Forgetting that ControlNet only modifies the positive conditioning — negative conditioning is unaffected
- Using `ConditioningCombine` when you meant sequential `ControlNetApply` — combine merges two conditionings equally; apply adds structural control on top of existing conditioning
