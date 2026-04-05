# ComfyUI Connection Types

ComfyUI enforces **exact type matching** on non-primitive connections. A `MODEL` output cannot wire to a `VAE` input. If the types don't match, the connection is rejected at the UI level and the workflow won't run.

---

## Main pipeline types

These are the types that flow through the graph as data. They determine a node's operation class (source, sampler, convert, etc.) and must match exactly on both ends of any link.

| Type | What it carries |
|---|---|
| `MODEL` | Diffusion model weights (U-Net) |
| `VAE` | Variational autoencoder |
| `CLIP` | Text encoder |
| `CLIP_VISION` | Vision encoder (e.g. IP-Adapter, unCLIP) |
| `CLIP_VISION_OUTPUT` | Encoded image from a CLIP vision model |
| `CONDITIONING` | Encoded text prompt (positive or negative) |
| `LATENT` | Latent image tensor (pre-decode) |
| `IMAGE` | Decoded pixel image tensor |
| `MASK` | Single-channel float mask |
| `VIDEO` | Video frame sequence |
| `AUDIO` | Audio tensor |
| `CONTROL_NET` | ControlNet model weights |
| `STYLE_MODEL` | Style model (e.g. for style transfer) |
| `GLIGEN` | GLIGEN spatial conditioning model |
| `UPSCALE_MODEL` | Upscaler model weights |
| `SAMPLER` | Sampler object (used by SamplerCustomAdvanced) |
| `SIGMAS` | Noise schedule sigmas tensor |
| `NOISE` | Noise tensor |
| `GUIDER` | CFG guider object |

---

## Primitive types

Nodes that only input/output these types are **Variable-class** — they carry configuration values, not pipeline data. Primitive connections are more flexible and do not have strict type enforcement in the same way.

`STRING`, `INT`, `FLOAT`, `BOOLEAN`, `COMBO`

---

## Checking compatibility before writing a patch or GraphBuilder connection

**Source output type** — use `comfyai/nodes/output-slot-index.json` (compact, no need to open the full registry):

```python
import json
slots = json.load(open('comfyai/nodes/output-slot-index.json'))['index']
src_type = slots['VAEDecode'][0]['type']   # 'IMAGE'  (slot 0)
```

**Destination input type** — look up in `node-registry.json`:

```python
registry = json.load(open('comfyai/nodes/node-registry.json'))
dst_type = registry['SaveImage']['input']['required']['images'][0]   # 'IMAGE'
```

If `src_type == dst_type`, the connection is valid. ComfyUI enforces exact matching — no implicit casting.

---

## Common compatible pairs

| From node | Output type | To node (example) | Input name |
|---|---|---|---|
| `CheckpointLoaderSimple` | `MODEL` | `KSampler` | `model` |
| `CheckpointLoaderSimple` | `CLIP` | `CLIPTextEncode` | `clip` |
| `CheckpointLoaderSimple` | `VAE` | `VAEDecode` | `vae` |
| `CLIPTextEncode` | `CONDITIONING` | `KSampler` | `positive` / `negative` |
| `KSampler` | `LATENT` | `VAEDecode` | `samples` |
| `VAEEncode` | `LATENT` | `KSampler` | `latent_image` |
| `VAEDecode` | `IMAGE` | `SaveImage` | `images` |
| `LoadImage` | `IMAGE` | `VAEEncode` | `pixels` |
| `LoadImage` | `MASK` | `VAEEncodeForInpaint` | `mask` |
