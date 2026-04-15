# Samplers, CFG, and Steps

> Your notes: comfyai/wiki/ (persists across updates)

Reference for KSampler settings. Look up what you need and return to your task.

---

## Sampler quick reference

| Sampler | Character | Best for |
|---|---|---|
| `euler` | Fast, slightly soft | Quick previews, rough ideation |
| `euler_a` | Adds randomness each step — high variation | Exploring, creative generation |
| `heun` | Smoother than euler, more stable | Middle ground: speed + quality |
| `dpm_2m` | Stable, deterministic, clean edges | General quality work |
| `dpmpp_2m` | Same as above, more refined | Strong default choice |
| `dpmpp_2m_karras` | dpm++ 2m + Karras schedule | **Best general-purpose choice for most workflows** |
| `dpmpp_sde` | Adds controlled stochasticity | Natural textures, subtle variation |
| `dpmpp_2s_a` | Sharper, more aggressive | Punchy detail (can be harsh) |
| `uni_pc` | Efficient at low steps | Real-time / low-step pipelines |
| `ddim` | Deterministic, less creative | Reproducibility; mostly legacy |
| `lms` | Slow convergence | Legacy; occasionally stylized outputs |

**Karras** is a noise schedule, not a sampler — it distributes noise more effectively across steps, producing sharper detail. Use it with `dpmpp_2m` for most work.

---

## Steps guidance

| Range | Character |
|---|---|
| 10–20 | Fast, rough — use for previews |
| 20–35 | Sweet spot for most workflows |
| 40–60+ | Diminishing returns; sometimes overcooked |

More steps ≠ better after a point. Some samplers peak at 20–25 steps. For distilled models (Flux Schnell), 1–4 steps is correct — see `knowledge/models/model-settings.md`.

---

## CFG scale

CFG controls how strictly the model follows your prompt vs its own learned priors.

| CFG | Effect |
|---|---|
| 1–3 | Loose / artistic — model wanders from prompt |
| 4–7 | **Balanced — default range for most workflows** |
| 8–12 | Strong guidance — sharper focus, risk of over-saturation and "AI look" |
| 13+ | Overdriven — broken anatomy, blown highlights, crispy artifacts |

CFG ranges by model family:

| Model | Typical CFG |
|---|---|
| SD 1.5 | 6–9 |
| SDXL | 4–7 |
| Flux | 1–2 (CFG-free — see models/model-settings.md) |

Flux breaks at high CFG. Do not use CFG > 2 with Flux models.

---

## Parameter interactions

These settings affect each other:

- **High CFG + high steps** → overcooked, artificial look
- **High denoise + high CFG** → chaotic regeneration
- **Low steps + complex sampler** → underdeveloped image
- **Euler at high CFG** → can get chaotic; prefer dpmpp_2m_karras at CFG > 7

---

## Presets by use case

**General quality (SDXL):**
- Sampler: `dpmpp_2m_karras` · Steps: 25–35 · CFG: 5–7

**General quality (Flux):**
- Sampler: `euler` · Steps: 20–30 · CFG: 1–2

**Fast preview:**
- Sampler: `euler_a` · Steps: 15–20 · CFG: 5–7

**Creative / exploratory:**
- Sampler: `euler_a` or `dpmpp_sde` · Steps: 20–30 · CFG: 3–6

**Img2img refinement:**
- Sampler: `dpmpp_2m_karras` · Steps: 20–30 · CFG: 4–6 · Denoise: 0.4–0.6

**Hires fix pass 2:**
- Sampler: `dpmpp_2m_karras` · Steps: 15–25 · CFG: slightly below pass 1 · Denoise: 0.45–0.55
