# LoRAs — Strength and Usage

Reference for applying LoRAs. For stacking multiple LoRAs or per-model behavior differences, see `knowledge/loras-stacking.md`.

---

## What a LoRA does

A LoRA nudges the base model toward a specific style, character, concept, or behavior without replacing the checkpoint. It modifies two things separately:

- **Model strength (UNet):** controls how the image looks — textures, shapes, detail, anatomy
- **CLIP strength:** controls how the prompt is interpreted — concept activation, trigger words, semantic bias

These are independent. Changing one does not automatically change the other.

---

## Strength ranges

| Range | Effect |
|---|---|
| 0.0 | LoRA is off |
| 0.3–0.7 | Subtle to balanced — blends style without overpowering base model |
| 0.8–1.0 | Clear LoRA identity — strong but stable for most quality LoRAs |
| 1.1–1.5 | Aggressive — risk of oversharpening, artifacts, exaggerated features |
| 1.5+ | Usually breaks output |

Strength is not linear — problems escalate quickly past ~1.2. Stay at or below 1.0 until you know a specific LoRA is stable at higher values.

---

## Model vs CLIP strength — when to separate them

Default: both at 0.8–1.0. This works for most LoRAs.

Adjust separately when:

| Situation | Action |
|---|---|
| Style LoRA too subtle | Increase model strength; keep CLIP moderate |
| Trigger word not activating | Increase CLIP strength |
| Visual effect too heavy | Lower model strength; keep CLIP higher |
| Model-only LoRA (see below) | CLIP strength has no effect — adjust model only |

Pattern: **model high, CLIP low** = strong visual style, less prompt distortion. **Model low, CLIP high** = concept activation with lighter visual change.

---

## Model-only LoRAs

Some LoRAs (common in Flux and newer architectures) only affect the UNet, not CLIP. Signs: changing CLIP strength does nothing; trigger words are not required. For these, rely entirely on model strength and clear prompting.

---

## Safe defaults

| Situation | Model | CLIP |
|---|---|---|
| Single LoRA, unknown behavior | 0.8 | 0.8 |
| Style blend (primary) | 0.7 | 0.7 |
| Style blend (secondary) | 0.4 | 0.4 |
| Flux LoRA | 0.5–0.7 | same or ignore |

---

## Common mistakes

- Running a LoRA at 1.0+ without checking cumulative strength (see `knowledge/loras-stacking.md`)
- Ignoring model vs CLIP distinction when one isn't working
- Using an SD1.5 LoRA on an SDXL checkpoint (incompatible — architectures don't match)
- Expecting a LoRA to fix a bad prompt — LoRAs bend the model, they don't compensate for unclear direction
