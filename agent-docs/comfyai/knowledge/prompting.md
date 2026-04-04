# Prompting by Model Family

Reference. Look up the model you are using and apply the appropriate style. Do not mix paradigms.

---

## Quick reference

| Model | Style | Grammar | Attention weights | Negative prompts |
|---|---|---|---|---|
| SD 1.5 | Comma-separated tags | None | Critical | Critical |
| SDXL | Hybrid (tags + light phrases) | Partial | Useful | Useful |
| Flux | Natural language sentences | Strong | Ignored | Mostly ignored |
| Qwen | Instructional natural language | Strong | Ignored | Rarely useful |
| Wan (video) | Scene + motion description | Strong | Ignored | Rarely useful |

---

## SD 1.5

The model treats each token as a concept. No sentence structure understanding.

```
1girl, solo, looking at viewer, detailed face, soft lighting, masterpiece, best quality
```

- Earlier tokens have slightly more influence
- Use attention weighting to boost specific features: `(detailed eyes:1.3), (masterpiece:1.2)`
- **Negative prompts are critical** — they actively suppress failure modes: `bad anatomy, extra fingers, blurry, low quality, worst quality`
- Writing full sentences does nothing — tokens beyond ~75 are truncated or diluted

---

## SDXL

More tolerant of natural phrasing. Both styles work:

```
cinematic photo of a woman standing in rain, detailed skin, soft lighting, 85mm lens
```

```
woman, rain, cinematic lighting, detailed skin, 85mm lens
```

- Start with subject, then modifiers, then style/camera
- Fewer, stronger tokens beat token spam
- Attention weights still work but are less necessary than in SD1.5
- Negative prompts still useful but overuse can flatten results

---

## Flux

Flux interprets intent and relationships. Write as if briefing a human artist.

```
A candid photograph of a woman standing in the rain at night, illuminated by soft neon lights, with realistic skin texture and shallow depth of field.
```

- Tag-style comma lists produce weaker, less coherent results
- `(masterpiece:1.2)` style weights are ignored
- **Negative prompts are largely ignored.** Use positive steering instead:
  - Bad: `blurry, bad anatomy`
  - Good: describe what you want — `sharp focus, accurate anatomy`
- No trigger-word tricks needed

---

## Qwen

Similar to Flux but even more instruction-oriented.

```
Generate an image of a futuristic city at sunset. The scene should include flying vehicles, reflective glass buildings, and warm cinematic lighting.
```

- Responds well to explicit constraints ("should include", "must not show")
- Token weighting has no effect
- Think of it as briefing an artist with a specific deliverable

---

## Wan and video models

Prompting in video models requires describing **motion and camera behavior**, not just a static scene.

```
A woman walking through a crowded street, the camera slowly tracking forward, with natural motion and cinematic lighting.
```

- Include subject motion: `walking`, `turning`, `running`
- Include camera motion: `slow pan`, `tracking shot`, `static camera`
- Describe temporal consistency: `same character throughout`, `consistent lighting`
- Overloading visual details causes flickering — keep scene description lean
- Conflicting motion instructions cause instability

---

## Common mistakes

- Using SD1.5 tag spam on Flux → weak results
- Writing paragraphs for SD1.5 → tokens truncated or diluted
- Using attention weights `(word:1.3)` on Flux/Qwen → ignored
- Heavy negative prompts on Flux → no effect
- Forgetting motion description in video models → static-looking video
