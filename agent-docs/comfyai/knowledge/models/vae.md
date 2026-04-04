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

### SD 1.5

The bundled VAE from most SD1.5 checkpoints works fine. Common standalone option: `vae-ft-mse-840000-ema-pruned.safetensors` — a fine-tuned VAE that produces slightly sharper decodes. Rarely necessary.

### SDXL

SDXL checkpoints ship with a VAE, but it has a known fp16 precision issue on some hardware that causes gray/washed output. Fix:

- Use the **SDXL VAE fp16 fix**: `sdxl_vae.safetensors` or `sdxl-vae-fp16-fix.safetensors` from Hugging Face (stabilityai/sdxl-vae)
- This is the most common cause of gray images on SDXL — check this before anything else

Some SDXL checkpoints ("baked VAE" variants) already include the fixed VAE and don't need a swap.

### Flux

Flux requires its own dedicated VAE — it is not compatible with SD1.5 or SDXL VAEs. The correct VAE is distributed alongside Flux weights:

- `ae.safetensors` (from black-forest-labs/FLUX.1-dev or FLUX.1-schnell)

For AIO Flux checkpoints (bundled), no action needed. For diffusion-only Flux base weights, you must load this VAE explicitly with `VAELoader`. Using the wrong VAE with Flux produces corrupted or black output.

### SD 3 / Stable Cascade / other newer models

These also ship model-specific VAEs. Always use the VAE distributed with the model — do not substitute SD1.5 or SDXL VAEs.

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
