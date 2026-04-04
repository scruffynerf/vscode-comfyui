# Inpainting

Inpainting, outpainting, and smart fill

> **These packs may not be installed in your environment.** Cross-check `node-registry.json` before using any node — see Step 1 in [find-a-node.md](../find-a-node.md).

Sorted by number of matching nodes (most relevant first).

- `comfyui-kjnodes` — [ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes) *(3 nodes)*: ImagePadForOutpaintMasked, ImagePadForOutpaintTargetSize, LatentInpaintTTM
- `comfyui-easy-use` — [ComfyUI-Easy-Use](https://github.com/yolain/ComfyUI-Easy-Use) *(2 nodes)*: applyFooocusInpaint, applyInpaint
- `comfyui-art-venture` — [ComfyUI ArtVenture](https://github.com/sipherxyz/comfyui-art-venture) *(2 nodes)*: LaMaInpaint, PrepareImageAndMaskForInpaint
- `comfyui-inpaint-cropandstitch` — [ComfyUI-Inpaint-CropAndStitch](https://github.com/lquesada/ComfyUI-Inpaint-CropAndStitch) *(2 nodes)*: InpaintCropImproved, InpaintStitchImproved
- `comfyui_fill-nodes` — [ComfyUI_Fill-Nodes](https://github.com/filliptm/ComfyUI_Fill-Nodes) *(2 nodes)*: InpaintCrop, Inpaint_Stitch
- `comfyui_controlnet_aux` — [comfyui_controlnet_aux](https://github.com/Fannovel16/comfyui_controlnet_aux): InpaintPreprocessor
- `was-ns` — [WAS Node Suite (Revised)](https://github.com/ltdrdata/was-node-suite-comfyui): Mask Fill Holes

---

To install a pack from this list:
```bash
cd {installDir}
uv pip install --extra-index-url https://nodes.appmana.com/simple/ <id>
```
Then restart the ComfyUI server.

← [Capability Index](index.md)
