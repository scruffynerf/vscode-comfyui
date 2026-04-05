# Model Loading Patterns

Reference for understanding `available-models.json` categories and how to load each type.

---

## Category → loader node

Every key in `available-models.json` → `models` maps to a specific loader node.

| Category | Loader node | AIO? | Notes |
|---|---|---|---|
| `checkpoints` | `CheckpointLoaderSimple` | **Yes** | MODEL + CLIP + VAE bundled |
| `diffusion_models` | `UNETLoader` | **No** | Needs separate VAE + CLIP — never use `CheckpointLoaderSimple` |
| `vae` | `VAELoader` | — | Standalone VAE |
| `clip` | `CLIPLoader` or `DualCLIPLoader` | — | Text encoders; see per-model file for which to use |
| `loras` | `LoraLoader` | — | Applied on top of loaded MODEL |
| `controlnet` | `ControlNetLoader` | — | See [controlnets.md](controlnets.md) |
| `upscale_models` | `UpscaleModelLoader` | — | Pixel upscalers (ESRGAN etc.) |
| `clip_vision` | `CLIPVisionLoader` | — | Image encoders (IP-Adapter, Redux, i2v) |
| `style_models` | `StyleModelLoader` | — | FLUX Redux etc. |
| `gligen` | `GLIGENLoader` | — | GLIGEN spatial conditioning (SD 1.5 era) |
| `ipadapter` | `IPAdapterModelLoader` | — | See [ipadapter.md](ipadapter.md) |
| `depthanything` | `DepthAnythingModelLoader` | — | See [vision-analysis.md](vision-analysis.md) |
| `sams` | `SAMModelLoader` | — | SAM / SAM2 segmentation |
| `ultralytics_bbox` | `UltralyticsDetectorProvider` | — | YOLO bounding box detection |
| `ultralytics_segm` | `UltralyticsDetectorProvider` | — | YOLO segmentation masks |
| `detection` | `PoseEstimationModelLoader` | — | ViTPose / pose detection |
| `upscale_models` | `UpscaleModelLoader` | — | |
| `latent_upscale_models` | `LatentUpscaleModelLoader` | — | LTX / HunyuanVideo latent upscalers |
| `SEEDVR2` | `SeedVR2ModelLoader` | — | Video super-resolution |
| `FlashVSR` | `FlashVSRLoader` | — | Video super-resolution |
| `vfi_models` | `VFIModelLoader` | — | Video frame interpolation (RIFE, FILM, AMT) |
| `mmaudio` | `WanVideoMMAudioModelLoader` | — | MMAudio video-to-audio |
| `audio_encoders` | `WanVideoAudioEncoderLoader` | — | Whisper audio encoders |
| `wav2vec2` | `WanVideoWav2Vec2Loader` | — | Wav2Vec2 speech models |
| `diff_controlnet` | `DiffControlNetLoader` | — | Kohya diff ControlNet (SD 1.5) |

**Rule**: if a model is in `diffusion_models`, it is **never** AIO. Look up its companion VAE and CLIP in the per-model file before building a workflow.

Custom-node-dependent categories (everything below `gligen`) are only populated in `available-models.json` if the relevant custom node is installed.

