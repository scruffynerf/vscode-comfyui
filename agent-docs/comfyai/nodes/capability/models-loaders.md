# Models / Loaders

Checkpoint, UNet, and diffusion model loading and management

> **These packs may not be installed in your environment.** Cross-check `node-registry.json` before using any node — see Step 1 in [find-a-node.md](../find-a-node.md).

Sorted by number of matching nodes (most relevant first).

- `comfyui-art-venture` — [ComfyUI ArtVenture](https://github.com/sipherxyz/comfyui-art-venture) *(6 nodes)*: CheckpointLoader, CheckpointMerge, CheckpointModelsToParametersPipe, CheckpointSave, ParametersPipeToCheckpointModels, CheckpointNameSelector
- `comfyui-multigpu` — [ComfyUI-MultiGPU](https://github.com/pollockjj/ComfyUI-MultiGPU) *(6 nodes)*: CheckpointLoaderAdvancedDisTorch2MultiGPU, CheckpointLoaderAdvancedMultiGPU, CheckpointLoaderSimpleDisTorch2MultiGPU, CheckpointLoaderSimpleMultiGPU, UNETLoaderDisTorch2MultiGPU, UNETLoaderMultiGPU
- `was-ns` — [WAS Node Suite (Revised)](https://github.com/ltdrdata/was-node-suite-comfyui) *(3 nodes)*: Checkpoint Loader, Checkpoint Loader (Simple), unCLIP Checkpoint Loader
- `mikey_nodes` — [mikey_nodes](https://github.com/bash-j/mikey_nodes) *(3 nodes)*: Checkpoint Loader Simple Mikey, CheckpointHash, CheckpointSaveModelOnly
- `comfyui-kjnodes` — [ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes) *(2 nodes)*: CheckpointLoaderKJ, CheckpointPerturbWeights
- `comfyui-easy-use` — [ComfyUI-Easy-Use](https://github.com/yolain/ComfyUI-Easy-Use) *(2 nodes)*: XYInputs: Checkpoint, kSamplerDownscaleUnet
- `ComfyUI-GGUF` — [ComfyUI-GGUF](https://github.com/city96/ComfyUI-GGUF) *(2 nodes)*: UnetLoaderGGUF, UnetLoaderGGUFAdvanced
- git-only ([install guide](../hiddenswitch/install-custom-nodes.md)) — [ComfyUI-Lora-Manager](https://github.com/willmiao/ComfyUI-Lora-Manager) *(2 nodes)*: CheckpointLoaderLM, UNETLoaderLM
- `comfyui-custom-scripts` — [ComfyUI-Custom-Scripts](https://github.com/pythongosssss/ComfyUI-Custom-Scripts): CheckpointLoader
- `comfyui-frame-interpolation` — [ComfyUI-Frame-Interpolation](https://github.com/Fannovel16/ComfyUI-Frame-Interpolation): IFUnet VFI
- `comfyui-ic-light` — [ComfyUI-IC-Light](https://github.com/kijai/ComfyUI-IC-Light): LoadAndApplyICLightUnet

---

To install a pack from this list:
```bash
cd {installDir}
uv pip install --extra-index-url https://nodes.appmana.com/simple/ <id>
```
Then restart the ComfyUI server.

← [Capability Index](index.md)
