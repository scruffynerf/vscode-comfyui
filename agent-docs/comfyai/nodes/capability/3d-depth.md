# 3D / Depth

Depth estimation, normal maps, 3D mesh, NeRF

> **These packs may not be installed in your environment.** Cross-check `node-registry.json` before using any node — see Step 1 in [find-a-node.md](../find-a-node.md).

Sorted by number of matching nodes (most relevant first).

- `comfyui_controlnet_aux` — [comfyui_controlnet_aux](https://github.com/Fannovel16/comfyui_controlnet_aux) *(10 nodes)*: DepthAnythingPreprocessor, DepthAnythingV2Preprocessor, LeReS-DepthMapPreprocessor, MediaPipe-FaceMeshPreprocessor, MeshGraphormer+ImpactDetector-DepthMapPreprocessor, MeshGraphormer-DepthMapPreprocessor, Metric3D-DepthMapPreprocessor, MiDaS-DepthMapPreprocessor, Zoe-DepthMapPreprocessor, Zoe_DepthAnythingPreprocessor
- `comfyui-depthanythingv2` — [ComfyUI-DepthAnythingV2](https://github.com/kijai/ComfyUI-DepthAnythingV2) *(2 nodes)*: DepthAnything_V2, DownloadAndLoadDepthAnythingV2Model
- `comfyui-impact-pack` — [ComfyUI Impact Pack](https://github.com/ltdrdata/ComfyUI-Impact-Pack): MediaPipeFaceMeshToSEGS
- `was-ns` — [WAS Node Suite (Revised)](https://github.com/ltdrdata/was-node-suite-comfyui): MiDaS Depth Approximation
- `ComfyUI-nunchaku` — [ComfyUI-nunchaku](https://github.com/nunchaku-tech/ComfyUI-nunchaku): NunchakuDepthPreprocessor
- `crt-nodes` — [CRT-Nodes](https://github.com/plugcrypt/CRT-Nodes): DepthAnythingTensorrtFormat
- `comfyui-propost` — [comfyui-propost](https://github.com/digitaljohn/comfyui-propost): ProPostDepthMapBlur

---

To install a pack from this list:
```bash
cd {installDir}
uv pip install --extra-index-url https://nodes.appmana.com/simple/ <id>
```
Then restart the ComfyUI server.

← [Capability Index](index.md)
