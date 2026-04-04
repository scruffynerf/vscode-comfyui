# LoRA Stacking and Per-Model Behavior

Reference. For LoRA fundamentals (strength ranges, model vs CLIP distinction), see `knowledge/loras.md` first.

---

## Stacking: the cumulative strength budget

When stacking multiple LoRAs, their strengths add together. Total effective strength should stay under **~1.2–1.5**.

| Example | Total | Outcome |
|---|---|---|
| LoRA A: 1.0 + LoRA B: 1.0 | 2.0 | Chaos — muddy styles, broken anatomy |
| LoRA A: 0.7 + LoRA B: 0.5 | 1.2 | Stable blend |
| LoRA A: 0.6 + LoRA B: 0.3 | 0.9 | Safe, clean mix |

Symptoms of exceeding the budget: muddy styles, conflicting features, broken anatomy, "deep fried" look.

---

## Stacking strategies

**Primary + secondary:**
- Main LoRA: 0.7–0.9
- Supporting LoRA: 0.2–0.4

**Style + detail:**
- Style LoRA: 0.6
- Detail enhancement LoRA: 0.3

**Never:** multiple LoRAs at full strength simultaneously.

---

## Load order

LoRAs are applied sequentially. Earlier LoRAs can dominate later ones. Put the primary LoRA first in the chain.

---

## Per-model behavior

### SD 1.5

- Common, wide variety available
- Often aggressive — less stable at high strength
- Sweet spot: **0.6–0.9**

### SDXL

- More subtle than SD1.5 — requires higher strength to show clearly
- Sweet spot: **0.8–1.2**
- Some LoRAs are base-only — not compatible with the SDXL refiner
- Resolution and prompt quality matter more than with SD1.5

### Flux

- LoRAs affect style and composition more holistically
- Effective at lower values — **0.4–0.8 typical**
- Many Flux LoRAs are model-only (CLIP strength does nothing)
- Negative prompts are less relevant — LoRA influence is more directly baked in
- Natural language prompts work better than tag-style when using Flux LoRAs

### Wan (video)

- Lower strength than image models to preserve temporal consistency
- Sweet spot: **0.3–0.7**
- Exceeding budget causes jittering and temporal inconsistency across frames

### Turbo / distilled models

- More fragile — less tolerance for high strength
- Keep strength lower: **0.4–0.7**

---

## Compatibility

LoRAs are architecture-specific. An SD1.5 LoRA will not load on SDXL, and vice versa. Flux LoRAs require Flux-based checkpoints. Always verify the LoRA's trained architecture matches your checkpoint before wiring.
