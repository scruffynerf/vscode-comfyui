# Segmentation

SAM, GroundingDINO, object detection, background removal

> **These packs may not be installed in your environment.** Cross-check `node-registry.json` before using any node — see Step 1 in [find-a-node.md](../find-a-node.md).

Sorted by number of matching nodes (most relevant first).

- `comfyui-sam2` — [ComfyUI-SAM2](https://github.com/neverbiasu/ComfyUI-SAM2) *(7 nodes)*: ModelLoader, ModelLoader (segment anything2), SAM2Segment, SAM2Segment (segment anything2), InvertMask (segment anything), SAM2ModelLoader, SAM2ModelLoader (segment anything2)
- `comfyui-segment-anything-2` — [ComfyUI-segment-anything-2](https://github.com/kijai/ComfyUI-segment-anything-2) *(5 nodes)*: DownloadAndLoadSAM2Model, Sam2AutoSegmentation, Sam2Segmentation, Sam2VideoSegmentation, Sam2VideoSegmentationAddPoints
- `comfyui_birefnet_ll` — [ComfyUI_BiRefNet_ll](https://github.com/lldacing/ComfyUI_BiRefNet_ll) *(3 nodes)*: LoadRembgByBiRefNetModel, RembgByBiRefNet, RembgByBiRefNetAdvanced
- `comfyui-inspyrenet-rembg` — [ComfyUI-Inspyrenet-Rembg](https://github.com/john-mnz/ComfyUI-Inspyrenet-Rembg) *(2 nodes)*: InspyrenetRembg, InspyrenetRembgAdvanced
- `comfyui_lg_tools` — [Comfyui_LG_Tools](https://github.com/LAOGOU-666/Comfyui_LG_Tools) *(2 nodes)*: InspyrenetRembgLoader, InspyrenetRembgProcess
- `comfyui_fill-nodes` — [ComfyUI_Fill-Nodes](https://github.com/filliptm/ComfyUI_Fill-Nodes): Audio_Segment_Extractor

---

To install a pack from this list:
```bash
cd {installDir}
uv pip install --extra-index-url https://nodes.appmana.com/simple/ <id>
```
Then restart the ComfyUI server.

← [Capability Index](index.md)
