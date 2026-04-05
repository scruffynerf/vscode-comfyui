# Model Knowledge Base

**Use this index to navigate directly to what you need. Do not read files you don't need.**

---

## I'm building a workflow — what model family am I using?

**Image generation:**

| Model | Go to |
|---|---|
| FLUX.1-dev, FLUX.1-schnell, Flux fp8, Flux GGUF | [image_models/flux.md](image_models/flux.md) |
| SDXL, Juggernaut XL, RealVisXL | [image_models/sdxl.md](image_models/sdxl.md) |
| Pony Diffusion V6 XL | [image_models/pony.md](image_models/pony.md) |
| Illustrious XL, NoobAI-XL | [image_models/illustrious.md](image_models/illustrious.md) |
| SD 1.5, DreamShaper, Realistic Vision, Deliberate | [image_models/sd15.md](image_models/sd15.md) |
| SD3 Medium, SD3.5 Large / Medium / Turbo | [image_models/sd3.md](image_models/sd3.md) |
| Z-Image Turbo, Z-Image | [image_models/z-image.md](image_models/z-image.md) |
| HiDream-I1 | [image_models/hidream.md](image_models/hidream.md) |
| Lumina Image 2.0 | [image_models/lumina.md](image_models/lumina.md) |
| Chroma (Flux-derived, no text encoder) | [image_models/chroma.md](image_models/chroma.md) |

**Video generation:**

| Model | Go to |
|---|---|
| Wan 2.1, Wan 2.2 (text-to-video, image-to-video) | [image_models/wan.md](image_models/wan.md) |
| HunyuanVideo | [image_models/hunyuan.md](image_models/hunyuan.md) |
| LTX-Video 2B, LTX-2 (13B), LTX-2.3 (22B) | [image_models/ltx.md](image_models/ltx.md) |
| Mochi Preview (video) | [image_models/mochi.md](image_models/mochi.md) |
| Stable Video Diffusion (SVD, SVD-XT) | [image_models/svd.md](image_models/svd.md) |
| Cosmos 1.0, Cosmos Predict2 | [image_models/cosmos.md](image_models/cosmos.md) |

**Audio generation:**

| Model | Go to |
|---|---|
| ACE-Step (music/audio from text) | [audio_models/ace-step.md](audio_models/ace-step.md) |
| MMAudio, Whisper, Wav2Vec2 (video audio) | [audio_models/audio.md](audio_models/audio.md) |

---

## I need a model for a specific capability

| I want to… | Go to |
|---|---|
| Upscale an image or video (ESRGAN, SeedVR2, FlashVSR, VFI) | [upscalers.md](upscalers.md) |
| Add ControlNet guidance to a workflow | [controlnets.md](controlnets.md) |
| Use IP-Adapter for image-prompt or face transfer | [ipadapter.md](ipadapter.md) |
| Segment objects, detect faces/bodies, estimate depth | [vision-analysis.md](vision-analysis.md) |
| Generate or sync audio to video | [audio_models/audio.md](audio_models/audio.md) |

---

## I need to understand how model loading works

| Question | Go to |
|---|---|
| What loader node does this category use? | [loading-patterns.md](loading-patterns.md) |
| Why is my output gray / corrupted? | [vae.md](vae.md) |
