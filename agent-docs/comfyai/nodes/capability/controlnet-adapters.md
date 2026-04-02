# ControlNet / Adapters

ControlNet, IP-Adapter, InstantID, PuLID — spatial and style conditioning

Sorted by number of matching nodes (most relevant first).

- `comfyui-easy-use` — [ComfyUI-Easy-Use](https://github.com/yolain/ComfyUI-Easy-Use) *(19 nodes)*: XYInputs: ControlNet, controlnetLoader, controlnetLoader++, controlnetLoaderADV, controlnetNames, controlnetStack, controlnetStackApply, instantIDApply, instantIDApplyADV, ipadapterApply, ipadapterApplyADV, ipadapterApplyEmbeds, ipadapterApplyEncoder, ipadapterApplyFaceIDKolors, ipadapterApplyFromParams, ipadapterApplyRegional, ipadapterStyleComposition, pulIDApply, pulIDApplyADV
- `comfyui-art-venture` — [ComfyUI ArtVenture](https://github.com/sipherxyz/comfyui-art-venture) *(8 nodes)*: ControlNetEfficientLoader, ControlNetEfficientLoaderAdvanced, ControlNetEfficientStacker, ControlNetEfficientStackerSimple, ControlNetLoader, ControlNetPreprocessor, IPAdapter, IPAdapterPipe
- `comfyui_pulid_flux_ll` — [ComfyUI_PuLID_Flux_ll](https://github.com/lldacing/ComfyUI_PuLID_Flux_ll) *(8 nodes)*: ApplyPulidFlux, FixPulidFluxPatch, PulidFluxEvaClipLoader, PulidFluxFaceDetector, PulidFluxFaceNetLoader, PulidFluxInsightFaceLoader, PulidFluxModelLoader, PulidFluxOptions
- `ComfyUI-nunchaku` — [ComfyUI-nunchaku](https://github.com/nunchaku-tech/ComfyUI-nunchaku) *(6 nodes)*: NunchakuFluxIPAdapterApply, NunchakuFluxPuLIDApplyV2, NunchakuIPAdapterLoader, NunchakuPuLIDLoaderV2, NunchakuPulidApply, NunchakuPulidLoader
- git-only ([install guide](../hiddenswitch/install-custom-nodes.md)) — [ComfyUI_InstantID](https://github.com/cubiq/ComfyUI_InstantID) *(6 nodes)*: ApplyInstantID, ApplyInstantIDAdvanced, ApplyInstantIDControlNet, InstantIDAttentionPatch, InstantIDFaceAnalysis, InstantIDModelLoader
- `comfyui-impact-pack` — [ComfyUI Impact Pack](https://github.com/ltdrdata/ComfyUI-Impact-Pack) *(5 nodes)*: ControlNetApplyAdvancedSEGS, ControlNetApplySEGS, ControlNetClearSEGS, IPAdapterApplySEGS, SchedulerAdapter
- `pulid_comfyui` — [PuLID_ComfyUI](https://github.com/cubiq/PuLID_ComfyUI) *(5 nodes)*: ApplyPulid, ApplyPulidAdvanced, PulidEvaClipLoader, PulidInsightFaceLoader, PulidModelLoader
- `comfyui-kjnodes` — [ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes) *(4 nodes)*: CustomControlNetWeightsFluxFromList, LoadResAdapterNormalization, SetShakkerLabsUnionControlNetType, TorchCompileControlNet
- `comfyui-multigpu` — [ComfyUI-MultiGPU](https://github.com/pollockjj/ComfyUI-MultiGPU) *(4 nodes)*: ControlNetLoaderDisTorch2MultiGPU, ControlNetLoaderMultiGPU, DiffControlNetLoaderDisTorch2MultiGPU, DiffControlNetLoaderMultiGPU
- `comfyui_controlnet_aux` — [comfyui_controlnet_aux](https://github.com/Fannovel16/comfyui_controlnet_aux) *(3 nodes)*: ControlNetAuxSimpleAddText, ControlNetPreprocessorSelector, ExecuteAllControlNetPreprocessors
- `ComfyUI-WanVideoWrapper` — [ComfyUI-WanVideoWrapper](https://github.com/kijai/ComfyUI-WanVideoWrapper) *(3 nodes)*: Controlnet, ControlnetLoader, Uni3C_ControlnetLoader
- `crt-nodes` — [CRT-Nodes](https://github.com/plugcrypt/CRT-Nodes) *(3 nodes)*: FluxControlnetSampler, FluxControlnetSamplerWithInjection, SmartControlNetApply
- `controlaltai-nodes` — [ControlAltAI_Nodes](https://github.com/gseth/ControlAltAI-Nodes) *(2 nodes)*: FluxControlNetApply, FluxUnionControlNetApply
- `comfyui-cogvideoxwrapper` — [ComfyUI-CogVideoXWrapper](https://github.com/kijai/ComfyUI-CogVideoXWrapper) *(2 nodes)*: ControlNet, DownloadAndLoadCogVideoControlNet
- `comfyui-mvadapter` — [ComfyUI-MVAdapter](https://github.com/huanngzh/ComfyUI-MVAdapter): ControlNetModelLoader

---

To install a pack from this list:
```bash
cd {installDir}
uv pip install --extra-index-url https://nodes.appmana.com/simple/ <id>
```
Then restart the ComfyUI server.

← [Capability Index](index.md)
