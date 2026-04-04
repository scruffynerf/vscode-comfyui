# Model Settings and Pre-Flight Checks

Read this file before queueing any workflow. When you are done, return to your task and apply the settings.

---

## Model type taxonomy

Not all entries in `available-models.json` under `checkpoints` are AIO (all-in-one: model + CLIP + VAE).

| Type | Description | Loader |
|------|-------------|--------|
| **AIO / full checkpoint** | Bundled model + CLIP + VAE. Most user-friendly. | `CheckpointLoaderSimple` |
| **Diffusion-only** | No CLIP, no VAE. Requires companion loaders. | `UNETLoader` + separate CLIP + VAE loaders |
| **Distilled** | Subtype of AIO. Uses CFG-free sampling. | `CheckpointLoaderSimple` |

Examples of diffusion-only models: Chroma1-Base, FLUX.1 raw base weights.
Examples of distilled models: Flux Schnell, Flux Dev, Lightning variants.

**Before recommending a checkpoint swap**: check whether the target model is AIO or diffusion-only. If unknown, note the uncertainty to the user — do not assume it will load via `CheckpointLoaderSimple` alone.

---

## Recommended sampler settings by model family

| Model family | Steps | CFG | Scheduler | Notes |
|---|---|---|---|---|
| **Flux Schnell** | 1–4 | 1.0 | `simple` or `euler` | Distilled, CFG-free. Steps > 4 waste compute with no quality gain. CFG > 1 degrades output. |
| **Flux Dev** | 20–30 | 1.0 | `simple` or `euler` | Also distilled/CFG-free; benefits from more steps than Schnell. |
| **SDXL** | 20–30 | 7.0 | `dpmpp_2m` + `karras` | CFG 5–9 is the useful range. |
| **SD 1.5** | 20–30 | 7.0 | `dpmpp_2m` + `karras` | Output quality well below SDXL/Flux. Use only when a LoRA or workflow specifically requires it. |
| **Chroma (diffusion-only)** | — | — | — | NOT an AIO checkpoint. Requires separate CLIP + VAE. Cannot load via `CheckpointLoaderSimple` alone. |

### Agent behavior rules

- If the loaded model is Flux and steps > 8 **or** CFG > 1.5: flag this to the user before queueing.
- If the loaded model is SD 1.5 and the user has not specifically requested it: flag it as an older model with lower output quality.
- If the model name is unrecognized: check `server-info.json` → `devices` for device context, then note uncertainty to the user rather than guessing.
