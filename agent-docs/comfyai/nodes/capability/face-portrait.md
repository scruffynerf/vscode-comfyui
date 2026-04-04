# Face / Portrait

Face swap, face enhancement, live portrait, expression transfer

> **These packs may not be installed in your environment.** Cross-check `node-registry.json` before using any node — see Step 1 in [find-a-node.md](../find-a-node.md).

Sorted by number of matching nodes (most relevant first).

- `comfyui-reactor` — [ComfyUI-ReActor](https://github.com/Gourieff/ComfyUI-ReActor) *(9 nodes)*: BuildFaceModel, FaceBoost, FaceSwap, FaceSwapOpt, LoadFaceModel, MakeFaceModelBatch, RestoreFace, RestoreFaceAdvanced, SaveFaceModel
- `comfyui-liveportraitkj` — [ComfyUI-LivePortraitKJ](https://github.com/kijai/ComfyUI-LivePortraitKJ) *(8 nodes)*: DownloadAndLoadLivePortraitModels, LivePortraitComposite, LivePortraitCropper, LivePortraitLoadCropper, LivePortraitLoadFaceAlignmentCropper, LivePortraitLoadMediaPipeCropper, LivePortraitProcess, LivePortraitRetargeting
- `ComfyUI-WanVideoWrapper` — [ComfyUI-WanVideoWrapper](https://github.com/kijai/ComfyUI-WanVideoWrapper) *(7 nodes)*: DrawArcFaceLandmarks, FaceMaskFromPoseKeypoints, FantasyPortraitFaceDetector, FantasyPortraitModelLoader, LynxEncodeFaceIP, LynxInsightFaceCrop, AddFantasyPortrait
- `comfyui_faceanalysis` — [ComfyUI_FaceAnalysis](https://github.com/cubiq/ComfyUI_FaceAnalysis) *(6 nodes)*: FaceAlign, FaceAnalysisModels, FaceBoundingBox, FaceEmbedDistance, FaceSegmentation, FaceWarp
- `comfyui-impact-pack` — [ComfyUI Impact Pack](https://github.com/ltdrdata/ComfyUI-Impact-Pack) *(3 nodes)*: FaceDetailer, FaceDetailerPipe, MediaPipeFaceMeshToSEGS
- `comfyui_pulid_flux_ll` — [ComfyUI_PuLID_Flux_ll](https://github.com/lldacing/ComfyUI_PuLID_Flux_ll) *(3 nodes)*: PulidFluxFaceDetector, PulidFluxFaceNetLoader, PulidFluxInsightFaceLoader
- `comfyui-easy-use` — [ComfyUI-Easy-Use](https://github.com/yolain/ComfyUI-Easy-Use) *(2 nodes)*: ipadapterApplyFaceIDKolors, portraitMaster
- `comfyui_controlnet_aux` — [comfyui_controlnet_aux](https://github.com/Fannovel16/comfyui_controlnet_aux) *(2 nodes)*: AnimeFace_SemSegPreprocessor, MediaPipe-FaceMeshPreprocessor
- `was-ns` — [WAS Node Suite (Revised)](https://github.com/ltdrdata/was-node-suite-comfyui) *(2 nodes)*: Image Crop Face, Image Paste Face
- `comfyui-art-venture` — [ComfyUI ArtVenture](https://github.com/sipherxyz/comfyui-art-venture) *(2 nodes)*: FaceDetailer, FaceDetailerPipe
- `comfyui-advancedliveportrait` — [ComfyUI-AdvancedLivePortrait](https://github.com/PowerHouseMan/ComfyUI-AdvancedLivePortrait) *(2 nodes)*: AdvancedLivePortrait, ExpressionEditor
- git-only ([install guide](../hiddenswitch/install-custom-nodes.md)) — [ComfyUI_InstantID](https://github.com/cubiq/ComfyUI_InstantID) *(2 nodes)*: FaceKeypointsPreprocessor, InstantIDFaceAnalysis
- `crt-nodes` — [CRT-Nodes](https://github.com/plugcrypt/CRT-Nodes) *(2 nodes)*: FaceEnhancementPipelineWithInjection, PonyFaceEnhancementPipelineWithInjection
- `comfyui-custom-scripts` — [ComfyUI-Custom-Scripts](https://github.com/pythongosssss/ComfyUI-Custom-Scripts): MathExpression
- `comfyui-rmbg` — [ComfyUI-RMBG](https://github.com/1038lab/ComfyUI-RMBG): FaceSegment
- `mikey_nodes` — [mikey_nodes](https://github.com/bash-j/mikey_nodes): FaceFixerOpenCV
- `bjornulf_custom_nodes` — [Bjornulf_custom_nodes](https://github.com/justUmen/Bjornulf_custom_nodes): HuggingFaceDownloader
- `pulid_comfyui` — [PuLID_ComfyUI](https://github.com/cubiq/PuLID_ComfyUI): PulidInsightFaceLoader
- `ComfyUI-WanAnimatePreprocess` — [ComfyUI-WanAnimatePreprocess](https://github.com/kijai/ComfyUI-WanAnimatePreprocess): PoseAndFaceDetection
- `comfyui-fluxtrainer` — [ComfyUI-FluxTrainer](https://github.com/kijai/ComfyUI-FluxTrainer): UploadToHuggingFace

---

To install a pack from this list:
```bash
cd {installDir}
uv pip install --extra-index-url https://nodes.appmana.com/simple/ <id>
```
Then restart the ComfyUI server.

← [Capability Index](index.md)
