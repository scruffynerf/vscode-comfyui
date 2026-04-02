# CLIP / VAE

CLIP text encoders, VAE encode/decode, conditioning

Sorted by number of matching nodes (most relevant first).

- `comfyui-multigpu` — [ComfyUI-MultiGPU](https://github.com/pollockjj/ComfyUI-MultiGPU) *(12 nodes)*: CLIPLoaderDisTorch2MultiGPU, CLIPLoaderMultiGPU, CLIPVisionLoaderDisTorch2MultiGPU, CLIPVisionLoaderMultiGPU, DualCLIPLoaderDisTorch2MultiGPU, DualCLIPLoaderMultiGPU, QuadrupleCLIPLoaderDisTorch2MultiGPU, QuadrupleCLIPLoaderMultiGPU, TripleCLIPLoaderDisTorch2MultiGPU, TripleCLIPLoaderMultiGPU, VAELoaderDisTorch2MultiGPU, VAELoaderMultiGPU
- `gguf` — [gguf](https://github.com/calcuis/gguf) *(6 nodes)*: AudioEncoderLoaderGGUF, ClipLoaderGGUF, DualClipLoaderGGUF, QuadrupleClipLoaderGGUF, TripleClipLoaderGGUF, VaeGGUF
- `comfyui-ppm` — [ComfyUI-ppm](https://github.com/pamparamm/ComfyUI-ppm) *(6 nodes)*: CLIPAttentionSelector, CLIPMicroConditioning, CLIPNegPip, CLIPTextEncodeBREAK, CLIPTextEncodeInvertWeights, CLIPTokenCounter
- `ComfyUI-GGUF` — [ComfyUI-GGUF](https://github.com/city96/ComfyUI-GGUF) *(4 nodes)*: CLIPLoaderGGUF, DualCLIPLoaderGGUF, QuadrupleCLIPLoaderGGUF, TripleCLIPLoaderGGUF
- `comfyui_essentials` — [ComfyUI_essentials](https://github.com/cubiq/ComfyUI_essentials) *(3 nodes)*: ApplyCLIPSeg+, CLIPTextEncodeSDXL+, LoadCLIPSegModels+
- `ComfyUI-nunchaku` — [ComfyUI-nunchaku](https://github.com/nunchaku-tech/ComfyUI-nunchaku) *(2 nodes)*: NunchakuTextEncoderLoader, NunchakuTextEncoderLoaderV2
- `comfyui-mvadapter` — [ComfyUI-MVAdapter](https://github.com/huanngzh/ComfyUI-MVAdapter) *(2 nodes)*: DiffusersMVVaeLoader, LdmVaeLoader
- `comfyui-easy-use` — [ComfyUI-Easy-Use](https://github.com/yolain/ComfyUI-Easy-Use): ipadapterApplyEncoder
- `comfyui_pulid_flux_ll` — [ComfyUI_PuLID_Flux_ll](https://github.com/lldacing/ComfyUI_PuLID_Flux_ll): PulidFluxEvaClipLoader
- `comfyui-supir` — [ComfyUI-SUPIR](https://github.com/kijai/ComfyUI-SUPIR): SUPIR_model_loader_v2_clip
- git-only ([install guide](../hiddenswitch/install-custom-nodes.md)) — [Comfy-WaveSpeed](https://github.com/chengzeyi/Comfy-WaveSpeed): VelocatorLoadAndQuantizeClip
- `pulid_comfyui` — [PuLID_ComfyUI](https://github.com/cubiq/PuLID_ComfyUI): PulidEvaClipLoader
- `comfyui_smznodes` — [ComfyUI_smZNodes](https://github.com/shiimizu/ComfyUI_smZNodes): smZ CLIPTextEncode
- `comfyui-itools` — [ComfyUI-iTools](https://github.com/MohammadAboulEla/ComfyUI-iTools): iToolsVaePreview

---

To install a pack from this list:
```bash
cd {installDir}
uv pip install --extra-index-url https://nodes.appmana.com/simple/ <id>
```
Then restart the ComfyUI server.

← [Capability Index](index.md)
