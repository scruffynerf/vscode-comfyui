# Core Pipeline Nodes

These are the nodes that form the backbone of most ComfyUI workflows. Use this as a mental model for pipeline structure — for full schemas, query `nodes/node-registry.json` by key.

---

## The standard pipeline

```
CheckpointLoaderSimple
  ↓ MODEL + CLIP + VAE
CLIPTextEncode (positive)
CLIPTextEncode (negative)  ← or ConditioningZeroOut; see workflow-patterns.md
  ↓ CONDITIONING
EmptyLatentImage            ← defines canvas size and batch
  ↓ LATENT
KSampler                    ← MODEL + pos/neg CONDITIONING + LATENT in → LATENT out
  ↓ LATENT
VAEDecode                   ← LATENT → IMAGE
  ↓ IMAGE
SaveImage
```

Optional stages added on top:
- LoRA: `LoraLoader` between checkpoint and KSampler (MODEL+CLIP in → MODEL+CLIP out)
- ControlNet: `ControlNetLoader` + `ControlNetApply` wraps the positive conditioning
- Upscale: `UpscaleModelLoader` + `ImageUpscaleWithModel` after VAEDecode
- img2img / inpainting: `VAEEncode` replaces `EmptyLatentImage` (IMAGE → LATENT)

---

## Node roles at a glance

| Node | Role | Without it |
|---|---|---|
| `CheckpointLoaderSimple` | Loads MODEL + CLIP + VAE | Nothing runs |
| `CLIPTextEncode` | Converts prompt string → CONDITIONING | No guidance signal |
| `KSampler` | Drives the diffusion sampling | No generation |
| `EmptyLatentImage` | Sets resolution and batch size | No canvas |
| `VAEDecode` | LATENT → IMAGE (visible pixels) | No viewable output |
| `SaveImage` | Writes to disk | Output lost |
| `PreviewImage` | Inline preview (no disk write) | Useful for intermediate checks |
| `LoraLoader` | Applies LoRA fine-tuning | Required for LoRA-based styles |
| `VAEEncode` | IMAGE → LATENT | Required for img2img/inpainting |
| `LatentUpscale` | Upscales in latent space | Use before a second KSampler pass for hires fix |

---

## Notes

- **Reroute nodes** are purely organizational — use them freely to keep wire routing readable in complex graphs.
- **Seed control**: use a `Primitive` (integer) node wired to KSampler's seed for explicit reproducibility.
- **Model sharing**: if a workflow has multiple KSampler branches, wire the same MODEL and VAE outputs to both rather than loading twice.
- For sampler settings per model family (Flux, SDXL, etc.), see `knowledge/models/model-settings.md`.
