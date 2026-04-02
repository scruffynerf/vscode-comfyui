# Upscaling

Super-resolution, tile upscaling, ESRGAN, SwinIR variants

Sorted by number of matching nodes (most relevant first).

- `comfyui-impact-pack` — [ComfyUI Impact Pack](https://github.com/ltdrdata/ComfyUI-Impact-Pack) *(10 nodes)*: IterativeImageUpscale, IterativeLatentUpscale, PixelKSampleUpscalerProvider, PixelKSampleUpscalerProviderPipe, PixelTiledKSampleUpscalerProvider, PixelTiledKSampleUpscalerProviderPipe, SEGSUpscaler, SEGSUpscalerPipe, TwoSamplersForMaskUpscalerProvider, TwoSamplersForMaskUpscalerProviderPipe
- `comfyui_ultimatesdupscale` — [ComfyUI_UltimateSDUpscale](https://github.com/ssitu/ComfyUI_UltimateSDUpscale) *(3 nodes)*: UltimateSDUpscale, UltimateSDUpscaleCustomSample, UltimateSDUpscaleNoUpscale
- `was-ns` — [WAS Node Suite (Revised)](https://github.com/ltdrdata/was-node-suite-comfyui) *(3 nodes)*: Latent Upscale by Factor (WAS), Upscale Model Loader, Upscale Model Switch
- `comfyui_fill-nodes` — [ComfyUI_Fill-Nodes](https://github.com/filliptm/ComfyUI_Fill-Nodes) *(2 nodes)*: Fal_SeedVR_Upscale, UpscaleModel
- `crt-nodes` — [CRT-Nodes](https://github.com/plugcrypt/CRT-Nodes) *(2 nodes)*: CRT_UpscaleModelAdv, PonyUpscaleSamplerWithInjection
- `comfyui-kjnodes` — [ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes): ImageUpscaleWithModelBatched
- `seedvr2_videoupscaler` — [ComfyUI-SeedVR2_VideoUpscaler](https://github.com/numz/ComfyUI-SeedVR2_VideoUpscaler): SeedVR2VideoUpscaler
- `controlaltai-nodes` — [ControlAltAI_Nodes](https://github.com/gseth/ControlAltAI-Nodes): ChooseUpscaleModel
- `comfyui-supir` — [ComfyUI-SUPIR](https://github.com/kijai/ComfyUI-SUPIR): SUPIR_Upscale
- `mikey_nodes` — [mikey_nodes](https://github.com/bash-j/mikey_nodes): Upscale Tile Calculator
- `bjornulf_custom_nodes` — [Bjornulf_custom_nodes](https://github.com/justUmen/Bjornulf_custom_nodes): ImageUpscaleWithModelTransparency
- `ComfyUI-UltimateSDUpscale-GGUF` — [ComfyUI-UltimateSDUpscale-GGUF](https://github.com/traugdor/ComfyUI-UltimateSDUpscale-GGUF): UltimateSDUpscaleGGUF

---

To install a pack from this list:
```bash
cd {installDir}
uv pip install --extra-index-url https://nodes.appmana.com/simple/ <id>
```
Then restart the ComfyUI server.

← [Capability Index](index.md)
