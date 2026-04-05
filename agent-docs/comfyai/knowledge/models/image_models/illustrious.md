# Illustrious XL / NoobAI-XL

Illustrious XL is an SDXL-based model fine-tuned on large-scale Danbooru anime art. NoobAI-XL is a closely related variant with additional training. Both use Danbooru-style tagging.

See [sdxl.md](sdxl.md) for base SDXL loading patterns (CheckpointLoaderSimple, VAE, refiner, etc.) — all apply here.

---

## Prompt style

Tag-based, similar to Danbooru conventions. Use quality/rating tags for best results:

**Positive quality tags:**
```
masterpiece, best quality, newest
```

**Negative quality tags:**
```
worst quality, low quality, old, ugly
```

---

## Sampler settings

- Steps: 20–30
- CFG: 5–7
- Sampler: `dpmpp_2m`
- Scheduler: `karras`
- Resolution: 1024×1024 (SDXL native)

---

## Notes

- NoobAI-XL shares most characteristics with Illustrious but has a different training distribution — check which variant you have
- The fp16 fix VAE (`sdxl_vae.safetensors`) is recommended as with standard SDXL
- LoRAs trained on Illustrious are not always compatible with standard SDXL or PonyXL

<!-- TODO: Confirm recommended quality tag format, CFG sweet spot, and any NoobAI-XL-specific differences. -->
