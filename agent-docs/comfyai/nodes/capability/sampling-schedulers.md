# Sampling / Schedulers

Custom samplers, scheduler curves, sigma manipulation

Sorted by number of matching nodes (most relevant first).

- `comfyui-easy-use` — [ComfyUI-Easy-Use](https://github.com/yolain/ComfyUI-Easy-Use) *(13 nodes)*: XYInputs: Sampler/Scheduler, XYInputs: Steps, cascadeKSampler, fullCascadeKSampler, fullkSampler, kSampler, kSamplerCustom, kSamplerDownscaleUnet, kSamplerInpainting, kSamplerLayerDiffusion, kSamplerSDTurbo, kSamplerTiled, unSampler
- `mikey_nodes` — [mikey_nodes](https://github.com/bash-j/mikey_nodes) *(9 nodes)*: Sampler, Sampler Base Only, Sampler Base Only Advanced, Sampler Tiled, Sampler Tiled Base Only, MikeyLatentTileSampler, MikeyLatentTileSamplerCustom, MikeySamplerTiledAdvanced, MikeySamplerTiledAdvancedBaseOnly
- `comfyui_essentials` — [ComfyUI_essentials](https://github.com/cubiq/ComfyUI_essentials) *(6 nodes)*: FluxSamplerParams+, KSamplerVariationsStochastic+, KSamplerVariationsWithNoise+, SamplerSelectHelper+, SchedulerSelectHelper+, TextEncodeForSamplerParams+
- `comfyui-detail-daemon` — [ComfyUI-Detail-Daemon](https://github.com/Jonseed/ComfyUI-Detail-Daemon) *(4 nodes)*: DetailDaemonGraphSigmasNode, DetailDaemonSamplerNode, LyingSigmaSampler, MultiplySigmas
- `comfyui-ppm` — [ComfyUI-ppm](https://github.com/pamparamm/ComfyUI-ppm) *(4 nodes)*: CFGPPSamplerSelect, DynSamplerSelect, PPMSamplerSelect, SamplerGradientEstimation
- git-only ([install guide](../hiddenswitch/install-custom-nodes.md)) — [LanPaint](https://github.com/scraed/LanPaint) *(4 nodes)*: LanPaint_KSampler, LanPaint_KSamplerAdvanced, LanPaint_SamplerCustom, LanPaint_SamplerCustomAdvanced
- `comfyui-mvadapter` — [ComfyUI-MVAdapter](https://github.com/huanngzh/ComfyUI-MVAdapter) *(2 nodes)*: DiffusersMVSampler, DiffusersMVSchedulerLoader
- `rgthree-comfy` — [rgthree-comfy](https://github.com/rgthree/rgthree-comfy): KSamplerConfig
- `comfyui-frame-interpolation` — [ComfyUI-Frame-Interpolation](https://github.com/Fannovel16/ComfyUI-Frame-Interpolation): KSampler Gradually Adding More Denoise (efficient)
- `controlaltai-nodes` — [ControlAltAI_Nodes](https://github.com/gseth/ControlAltAI-Nodes): FluxSampler
- `ComfyUI-MelBandRoFormer` — [ComfyUI-MelBandRoFormer](https://github.com/kijai/ComfyUI-MelBandRoFormer): MelBandRoFormerSampler
- `comfyui-fluxtrainer` — [ComfyUI-FluxTrainer](https://github.com/kijai/ComfyUI-FluxTrainer): FluxKohyaInferenceSampler
- git-only ([install guide](../hiddenswitch/install-custom-nodes.md)) — [ComfyUI-MMAudio](https://github.com/kijai/ComfyUI-MMAudio): MMAudioSampler
- `comfyui-enricos-nodes` — [ComfyUI-enricos-nodes](https://github.com/erosDiffusion/ComfyUI-enricos-nodes): ImageColorSampler
- `comfyui-itools` — [ComfyUI-iTools](https://github.com/MohammadAboulEla/ComfyUI-iTools): iToolsKSampler

---

To install a pack from this list:
```bash
cd {installDir}
uv pip install --extra-index-url https://nodes.appmana.com/simple/ <id>
```
Then restart the ComfyUI server.

← [Capability Index](index.md)
