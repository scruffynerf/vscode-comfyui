# ControlNet Models

ControlNets add structural guidance (edges, depth, pose, etc.) to generation.

- **SD 1.5**: load with `ControlNetLoader` → `ControlNetApply` or `ControlNetApplyAdvanced`. Model list: [sd15.md](image_models/sd15.md#controlnet-models).
- **SDXL**: same loader. Model list: [sdxl.md](image_models/sdxl.md#controlnet-models).
- **FLUX**: ControlNets are LoRAs — load with `LoraLoader`, not `ControlNetLoader`. Model list: [flux.md](image_models/flux.md#controlnet-models).

---

## Choosing a ControlNet

| Goal | Use |
|---|---|
| Follow a composition sketch | Canny (SD 1.5) or Flux Canny LoRA |
| Match a pose | OpenPose (SD 1.5 or SDXL) |
| Follow depth from a reference image | Depth (SD 1.5) or Flux Depth LoRA |
| Enhance detail without changing composition | Tile (SD 1.5) |
| Edit based on text instruction | ip2p (SD 1.5) |
