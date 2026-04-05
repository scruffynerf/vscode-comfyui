# VAE Selection and Troubleshooting

Reference. Check symptoms first, then look up your model family for the correct VAE.

---

## Symptoms of a mismatched or broken VAE

| Symptom | Likely cause |
|---|---|
| Washed-out, desaturated colors | Wrong VAE for model (common with SDXL using SD1.5 VAE) |
| Gray or near-black output | VAE mismatch or NaN/overflow — common with fp16 VAE on some hardware |
| Blurry, smeared output | VAE decode step failing — usually a precision issue |
| Correct composition but wrong color palette | Using SD1.5's bundled VAE with SDXL or vice versa |
| Extremely dark or muddy image | Flux loaded without its required VAE |

If you see any of these, swap the VAE before adjusting anything else.

---

## Bundled VAE vs standalone

`CheckpointLoaderSimple` outputs a VAE alongside MODEL and CLIP. For many workflows this is fine. Use a standalone `VAELoader` when:

- The bundled VAE is known to produce artifacts for this checkpoint
- You need the SDXL fp16 fix VAE (see below)
- You are using a diffusion-only model that has no bundled VAE (Flux base weights, Chroma)
- You want to swap VAEs for experimental output comparison

To override: wire a `VAELoader` output to the `vae` input of `VAEDecode` / `VAEEncode`, bypassing the checkpoint's bundled VAE.

---

## VAE by model family

Each model file documents its required VAE. Go directly to the family file — do not rely on this file for VAE filenames.

- SD 1.5: [sd15.md](image_models/sd15.md#vae)
- SDXL: [sdxl.md](image_models/sdxl.md#vae)
- Flux: [flux.md](image_models/flux.md#vae)
- SD3/SD3.5: see companion files table in [sd3.md](image_models/sd3.md)
- Other models: VAE filename is in the companion files table in the model's file

---

## VAE precision and hardware

On Apple Silicon (MPS), fp16 VAE operations can overflow. If you see gray or NaN output:

- Try forcing the VAE to full precision: some workflows use a `VAEDecodeTiled` node or configure the VAE in fp32
- Check `server-info.json` for device info — see `knowledge/apple-silicon.md`

---

## Common mistakes

- Using SDXL bundled VAE and assuming gray output is a prompt problem — check VAE first
- Not loading a VAE at all when using a diffusion-only model (Flux base, Chroma) — the pipeline will error or produce garbage
- Loading the correct checkpoint but the wrong VAE file version (e.g. an older fp16-broken SDXL VAE)
