# Image processing

Color correction, blending, compositing, filtering, pixel-level edits

> **These packs may not be installed in your environment.** Cross-check `node-registry.json` before using any node — see Step 1 in [find-a-node.md](../find-a-node.md).

Sorted by number of matching nodes (most relevant first).

- `was-ns` — [WAS Node Suite (Revised)](https://github.com/ltdrdata/was-node-suite-comfyui) *(24 nodes)*: Blend Latents, Bounded Image Blend, Bounded Image Blend with Mask, Image Blend, Image Blend by Mask, Image Bloom Filter, Image Canny Filter, Image Color Palette, Image Dragan Photography Filter, Image Edge Detection Filter, Image Filter Adjustments, Image High Pass Filter, Image Lucy Sharpen, Image Median Filter, Image Mix RGB Channels, Image Monitor Effects Filter, Image Nova Filter, Image Remove Color, Image Rotate Hue, Image Select Color, Image Style Filter, Image Voronoi Noise Filter, Image fDOF Filter, Images to RGB
- `comfyui-impact-pack` — [ComfyUI Impact Pack](https://github.com/ltdrdata/ComfyUI-Impact-Pack) *(14 nodes)*: SEGSIntersectionFilter, SEGSLabelFilter, SEGSNMSFilter, SEGSOrderedFilter, SEGSRangeFilter, LatentPixelScale, PixelKSampleHookCombine, PixelKSampleUpscalerProvider, PixelKSampleUpscalerProviderPipe, PixelTiledKSampleUpscalerProvider, PixelTiledKSampleUpscalerProviderPipe, SEGSLabelFilterDetailerHookProvider, SEGSOrderedFilterDetailerHookProvider, SEGSRangeFilterDetailerHookProvider
- `comfyui_essentials` — [ComfyUI_essentials](https://github.com/cubiq/ComfyUI_essentials) *(7 nodes)*: ImageColorMatch+, ImageColorMatchAdobe+, ImageComposite+, ImageCompositeFromMaskBatch+, ImageSmartSharpen+, MaskFromColor+, PixelOEPixelize+
- `comfyui_fill-nodes` — [ComfyUI_Fill-Nodes](https://github.com/filliptm/ComfyUI_Fill-Nodes) *(6 nodes)*: Audio_Reactive_Brightness, Audio_Reactive_Saturation, ColorPicker, PixelArtShader, PixelSort, ReplaceColor
- `comfyui-post-processing-nodes` — [ComfyUI-post-processing-nodes](https://github.com/EllangoK/ComfyUI-post-processing-nodes) *(6 nodes)*: ArithmeticBlend, Blend, ColorCorrect, ColorTint, PixelSort, Sharpen
- `comfyui-dream-project` — [comfyui-dream-project](https://github.com/alt-key-project/comfyui-dream-project) *(6 nodes)*: Image Brightness Adjustment, Image Color Shift, Image Contrast Adjustment, Image Sequence Blend, Palette Color Align, Palette Color Shift
- `comfyui-kjnodes` — [ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes) *(5 nodes)*: ColorMatch, ColorMatchV2, ColorToMask, FilterZeroMasksAndCorrespondingImages, ImageBatchFilter
- `basic_data_handling` — [Basic data handling](https://github.com/StableLlama/ComfyUI-basic_data_handling) *(5 nodes)*: DataListFilter, DataListFilterSelect, DictFilterByKeys, PathLoadImageRGB, PathSaveImageRGB
- `cg-image-filter` — [cg-image-filter](https://github.com/chrisgoringe/cg-image-filter) *(4 nodes)*: Image Filter, Mask Image Filter, Text Image Filter, Text Image Filter with Extras
- `comfyui-easy-use` — [ComfyUI-Easy-Use](https://github.com/yolain/ComfyUI-Easy-Use) *(3 nodes)*: imageColorMatch, imagePixelPerfect, latentCompositeMaskedWithCond
- `comfyui-art-venture` — [ComfyUI ArtVenture](https://github.com/sipherxyz/comfyui-art-venture) *(3 nodes)*: ColorBlend, ColorCorrect, ImageAlphaComposite
- `comfyui_controlnet_aux` — [comfyui_controlnet_aux](https://github.com/Fannovel16/comfyui_controlnet_aux) *(2 nodes)*: ColorPreprocessor, PixelPerfectResolution
- `comfyui-rmbg` — [ComfyUI-RMBG](https://github.com/1038lab/ComfyUI-RMBG) *(2 nodes)*: ColorInput, ColorToMask
- `crt-nodes` — [CRT-Nodes](https://github.com/plugcrypt/CRT-Nodes) *(2 nodes)*: BatchBrightnessCurve, ColorIsolationFX
- `comfyui-enricos-nodes` — [ComfyUI-enricos-nodes](https://github.com/erosDiffusion/ComfyUI-enricos-nodes) *(2 nodes)*: CompositorColorPicker, ImageColorSampler
- `comfyui_lg_tools` — [Comfyui_LG_Tools](https://github.com/LAOGOU-666/Comfyui_LG_Tools) *(2 nodes)*: ColorAdjustment, FastCanvasComposite
- `comfyui-reactor` — [ComfyUI-ReActor](https://github.com/Gourieff/ComfyUI-ReActor): ImageRGBA2RGB
- `controlaltai-nodes` — [ControlAltAI_Nodes](https://github.com/gseth/ControlAltAI-Nodes): NoisePlusBlend
- `comfyui-liveportraitkj` — [ComfyUI-LivePortraitKJ](https://github.com/kijai/ComfyUI-LivePortraitKJ): LivePortraitComposite
- `comfyui-ppm` — [ComfyUI-ppm](https://github.com/pamparamm/ComfyUI-ppm): MaskCompositePPM
- `kaytool` — [KayTool](https://github.com/kk8bit/kaytool): Color_Adjustment
- git-only ([install guide](../hiddenswitch/install-custom-nodes.md)) — [LanPaint](https://github.com/scraed/LanPaint): LanPaint_MaskBlend

---

To install a pack from this list:
```bash
cd {installDir}
uv pip install --extra-index-url https://nodes.appmana.com/simple/ <id>
```
Then restart the ComfyUI server.

← [Capability Index](index.md)
