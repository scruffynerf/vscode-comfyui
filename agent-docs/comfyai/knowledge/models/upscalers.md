# Upscalers and Video Enhancement

Reference for choosing and using upscale models. Covers pixel upscalers, video super-resolution, and video frame interpolation.

---

## Pixel upscalers (images)

In `available-models.json` → `upscale_models`. Load with `UpscaleModelLoader` → `ImageUpscaleWithModel`.

| Model | Notes |
|---|---|
| `RealESRGAN_x4plus.safetensors` | General purpose 4× upscaler, good default |
| `RealESRGAN_x4plus.pth` | Same model, .pth format (older) |
| `4xNomos8k_atd_jpg.pth` | Specialized for JPEG artifact removal + upscale |

**When to use**: after `VAEDecode`, before `SaveImage`. Typical pipeline: `VAEDecode → ImageUpscaleWithModel → SaveImage`.

---

## Latent upscalers

Latent upscalers are model-family-specific — do not mix them across families.

- LTX-2 / LTX-2.3: see [ltx.md](image_models/ltx.md#latent-upscalers)
- HunyuanVideo: see [hunyuan.md](image_models/hunyuan.md#latent-upscaler)

---

## Video super-resolution: SeedVR2

In `available-models.json` → `SEEDVR2`. Requires the ComfyUI-SeedVR2_VideoUpscaler custom node.

| Model | Notes |
|---|---|
| `seedvr2_ema_3b_fp16.safetensors` | 3B params, full quality |
| `seedvr2_ema_3b_fp8_e4m3fn.safetensors` | 3B fp8, reduced VRAM |
| `seedvr2_ema_7b_fp16.safetensors` | 7B params, highest quality |
| `seedvr2_ema_7b_fp8_e4m3fn_mixed_block35_fp16.safetensors` | 7B fp8 mixed |
| `seedvr2_ema_3b-Q4_K_M.gguf` / `Q8_0.gguf` | GGUF quantized 3B |
| `seedvr2_ema_7b-Q4_K_M.gguf` | GGUF quantized 7B |
| `ema_vae_fp16.safetensors` | SeedVR2 VAE (required companion) |

SeedVR2 is a diffusion-based video super-resolution model — significantly better quality than traditional pixel upscalers for video. The VAE (`ema_vae_fp16.safetensors`) is required alongside the main model.

---

## Video super-resolution: FlashVSR

In `available-models.json` → `FlashVSR`. Requires the FlashVSR custom node.

| Model | Notes |
|---|---|
| `FlashVSR/LQ_proj_in.ckpt` | Input projection |
| `FlashVSR/TCDecoder.ckpt` | Temporal-consistent decoder |
| `FlashVSR/diffusion_pytorch_model_streaming_dmd.safetensors` | Main diffusion model |

FlashVSR requires all three files together. Faster than SeedVR2, slightly lower quality ceiling.

---

## Video frame interpolation (VFI)

In `available-models.json` → `vfi_models`. Requires the ComfyUI-Frame-Interpolation custom node.

VFI increases frame rate by generating intermediate frames — turns 24fps video into 48fps or 60fps.

| Model | Notes |
|---|---|
| `rife49.pth` / `rife47.pth` / `rife46.pth` | RIFE — fastest, good quality. Use latest version. |
| `film_net_fp32.pt` / `film_net_fp16.pt` | FILM — better for large motion, slower |
| `amt-s.pth` / `amt-l.pth` / `amt-g.pth` | AMT — alternative to FILM |
| `gimmvfi_f_arb_lpips_fp32.safetensors` | GIMM-VFI — high quality, slowest |

**Recommendation**: RIFE (`rife49.pth`) for most use cases — fastest with good quality. FILM or GIMM-VFI when motion is large or quality is critical.

---

## Choosing between approaches

| Scenario | Recommended |
|---|---|
| Single image 4× upscale | RealESRGAN_x4plus |
| JPEG artifact removal + upscale | 4xNomos8k_atd_jpg |
| Video quality enhancement | SeedVR2 3B fp8 (balanced) or 7B (best quality) |
| Fast video upscale | FlashVSR |
| Increase video frame rate | RIFE (rife49.pth) |
| Increase frame rate, large motion | FILM |
