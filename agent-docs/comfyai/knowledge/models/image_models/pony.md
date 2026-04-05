# Pony Diffusion V6 XL

Pony Diffusion V6 XL (PonyXL) is an SDXL-based model fine-tuned on anime, furry, and stylized art (Danbooru + e621 tags). It uses a score-based quality tag system.

See [sdxl.md](sdxl.md) for base SDXL loading patterns (CheckpointLoaderSimple, VAE, refiner, etc.) — all apply here.

---

## Quality tag system

PonyXL was trained with score tags. Include these in your positive and negative prompts:

**Positive** (quality signal):
```
score_9, score_8_up, score_7_up
```

**Negative** (reject low quality):
```
score_4, score_5, score_6, score_4_up, score_5_up, score_6_up
```

Omitting these tags reduces output quality noticeably.

---

## Sampler settings

- Steps: 20–30
- CFG: 5–7
- Sampler: `dpmpp_2m`
- Scheduler: `karras`
- Resolution: 1024×1024 (SDXL native)

---

## Notes

- Prompt style: Danbooru / e621 tags, comma-separated
- Responds well to character/species tags from those datasets
- NSFW capability is present (model is uncensored by default)
- The fp16 fix VAE (`sdxl_vae.safetensors`) is recommended as with standard SDXL

<!-- TODO: Confirm exact optimal CFG and sampler variants from community testing. Add example prompt structure. -->
