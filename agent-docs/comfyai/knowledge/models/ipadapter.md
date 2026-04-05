# IP-Adapter Models

IP-Adapter conditions generation on a reference image rather than (or in addition to) a text prompt. Available for SD 1.5 and SDXL model families.

Requires: ComfyUI-IPAdapter-plus custom node. Load with `IPAdapterModelLoader`.
Also needs a `CLIPVisionLoader` — see `available-models.json` → `clip_vision`.

For model lists (including FaceID): [sd15.md](image_models/sd15.md#ip-adapter-models) (SD 1.5) or [sdxl.md](image_models/sdxl.md#ip-adapter-models) (SDXL).

---

## Choosing by task

| Task | Model |
|---|---|
| Style transfer from reference image | `ip-adapter-plus_sd15` or `ip-adapter-plus_sdxl_vit-h` |
| Face likeness (style, not identity) | `ip-adapter-plus-face_sd15` |
| Consistent character identity | FaceID (`ip-adapter-faceid-plusv2_sd15`) |
| Subtle reference, keep text control | `ip-adapter_sd15_light` |
