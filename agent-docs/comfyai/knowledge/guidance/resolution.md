# Resolution and Aspect Ratios

Reference for choosing correct dimensions. Look up your model family, pick dimensions, then return to your task.

---

## Native resolutions by model

| Model | Native resolution | Pixel count |
|---|---|---|
| SD 1.5 | 512×512 | ~262k |
| SDXL | 1024×1024 | ~1M |
| Flux | 1024×1024 | ~1M |

"Native" means the model's training sweet spot. You can use other aspect ratios as long as total pixel count stays near the native norm. Deviating too far causes artifacts.

---

## What goes wrong at the wrong resolution

**Too low (e.g. SDXL at 512×512):** model is underutilized — simpler composition, washed-out textures, less detail.

**Too high without upscaling (e.g. SD1.5 at 1024×1024):** model tries to fit multiple compositions into one canvas — doubled subjects, extra limbs, fragmented scenes, tiling artifacts. This is the most common resolution mistake.

**Rule:** stay near the model's native pixel count. Change the aspect ratio, not the scale.

---

## Recommended dimensions

### SD 1.5 (~262k–400k pixels)

| Aspect | Dimensions |
|---|---|
| 1:1 | 512×512 |
| 2:3 portrait | 512×768 |
| 3:4 portrait | 512×896 |
| 3:2 landscape | 768×512 |
| 4:3 landscape | 896×512 |

Stay within ~700k pixels for stability.

### SDXL / Flux (~1M pixels)

| Aspect | Dimensions |
|---|---|
| 1:1 | 1024×1024 |
| 2:3 portrait | 832×1216 |
| 3:4 portrait | 896×1152 |
| 3:2 landscape | 1216×832 |
| 4:3 landscape | 1152×896 |
| 16:9 landscape | 1280×720 |

---

## Aspect ratio and composition

Aspect ratio controls how the model composes scenes — not just the shape:

- **1:1 square** — centered subjects, balanced framing, most predictable
- **Portrait (2:3, 3:4)** — full-body figures, vertical emphasis
- **Landscape (3:2, 16:9)** — environments, wide scenes, multiple subjects
- **Extreme ratios** — risk of stretched anatomy and empty-area artifacts; use two-pass upscaling instead

---

## Resolution vs VRAM

Latents are 1/8 the pixel dimensions (512×512 → 64×64 latent). Higher resolution scales VRAM usage non-linearly.

| Change | VRAM impact |
|---|---|
| Resolution increase | Very high |
| Batch size increase | Medium |
| More steps | Low |

**Resolution is the dominant VRAM driver.** If running out of memory, reduce resolution before reducing steps. Use the two-pass hires fix pattern (`knowledge/hires-fix.md`) to get high-resolution results from a low-resolution base generation.

---

## Batch size

- Start at 1. Increase only after the workflow is stable.
- VRAM scales linearly with batch size.
- At lower resolutions you can fit more images per batch; at 1024+ on constrained hardware, batch 1 is often the limit.
