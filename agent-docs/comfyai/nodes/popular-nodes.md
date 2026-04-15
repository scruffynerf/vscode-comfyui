# Popular Custom Nodes

Top 100 active nodes from the [Comfy Registry](https://comfyregistry.org), sorted into categories.
The `id` is the `uv pip install` name.  Install via appmana (see [install-custom-nodes.md](../knowledge/hiddenswitch/install-custom-nodes.md)):

```bash
cd {installDir}
uv pip install --extra-index-url https://nodes.appmana.com/simple/ <id>
```

Then restart the ComfyUI server.

Entries marked **git-only** are not yet in the appmana catalog — install from git instead
(see [install-custom-nodes.md](../knowledge/hiddenswitch/install-custom-nodes.md)).

## General utilities

| id / install | Name | Description |
|--------------|------|-------------|
| `comfyui-kjnodes` | [ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes) | Large utility pack from kijai: mask/image manipulation, scheduling helpers, noise injection, model management, and LoRA stack nodes. |
| `rgthree-comfy` | [rgthree-comfy](https://github.com/rgthree/rgthree-comfy) | Essential quality-of-life pack. Includes: Power Lora Loader (load multiple LoRAs cleanly), Context nodes (pass groups of values between nodes without spaghetti wires), Fast Groups Bypasser/Muter (toggle whole sections at once), Reroute nodes, Bookmark nodes, Display Any (inspect any value mid-workflow), and a node fixer for broken workflows. Worth installing for almost any workflow. |
| `comfyui-easy-use` | [ComfyUI-Easy-Use](https://github.com/yolain/ComfyUI-Easy-Use) | To enhance the usability of ComfyUI, optimizations and integrations have been implemented for several commonly used nodes. |
| `comfyui-impact-pack` | [ComfyUI Impact Pack](https://github.com/ltdrdata/ComfyUI-Impact-Pack) | This node pack offers various detector nodes and detailer nodes that allow you to configure a workflow that automatically enhances facial details. And provide iterative upscaler. |
| `comfyui_essentials` | [ComfyUI_essentials](https://github.com/cubiq/ComfyUI_essentials) | Essential nodes that are weirdly missing from ComfyUI core. With few exceptions they are new features and not commodities. |
| `comfyui-custom-scripts` | [ComfyUI-Custom-Scripts](https://github.com/pythongosssss/ComfyUI-Custom-Scripts) | Enhancements & experiments for ComfyUI, mostly focusing on UI features |
| `comfyui-impact-subpack` | [ComfyUI Impact Subpack](https://github.com/ltdrdata/ComfyUI-Impact-Subpack) | This node pack provides nodes that complement the Impact Pack, such as the UltralyticsDetectorProvider. |
| `was-ns` | [WAS Node Suite (Revised)](https://github.com/ltdrdata/was-node-suite-comfyui) | A massive node pack consisting of over 200 nodes, including image processing, masking, text handling, and arithmetic operations. Replaces older retired pack by original author |
| `comfyui-mxtoolkit` | [ComfyUI-mxToolkit](https://github.com/Smirnov75/ComfyUI-mxToolkit) | A set of useful nodes for convenient use of ComfyUI, including: Seed randomization before the generation process starts, with saving of the last used values and the ability to automatically interrupt the current generation; A function to pause the generation process; Slider nodes for convenient control of input parameters; An alternative version of the standard Reroute node. |
| `comfyui-art-venture` | [ComfyUI ArtVenture](https://github.com/sipherxyz/comfyui-art-venture) | A comprehensive set of custom nodes for ComfyUI, focusing on utilities for image processing, JSON manipulation, model operations and working with object via URLs |
| `comfyui_fill-nodes` | [ComfyUI_Fill-Nodes](https://github.com/filliptm/ComfyUI_Fill-Nodes) | Fill-Nodes is a versatile collection of custom nodes for ComfyUI that extends functionality across multiple domains. Features include advanced image processing (pixelation, slicing, masking), visual effects generation (glitch, halftone, pixel art), comprehensive file handling (PDF creation/extraction, Google Drive integration), AI model interfaces (GPT, DALL-E, Hugging Face), utility nodes for workflow enhancement, and specialized tools for video processing, captioning, and batch operations. The pack provides both practical workflow solutions and creative tools within a unified node collection. |
| `comfyui-depthanythingv2` | [ComfyUI-DepthAnythingV2](https://github.com/kijai/ComfyUI-DepthAnythingV2) | ComfyUI nodes to use [a/DepthAnythingV2](https://depth-anything-v2.github.io/) NOTE:Models autodownload to ComfyUI/models/depthanything from [a/https://huggingface.co/Kijai/DepthAnythingV2-safetensors/tree/main](https://huggingface.co/Kijai/DepthAnythingV2-safetensors/tree/main) |
| `ComfyUI-QwenVL` | [ComfyUI-QwenVL](https://github.com/1038lab/ComfyUI-QwenVL) | ComfyUI-QwenVL custom node: Integrates the Qwen-VL series, including Qwen2.5-VL and the latest Qwen3-VL, with GGUF support for advanced multimodal AI in text generation, image understanding, and video analysis. |
| `qweneditutils` | [Comfyui-QwenEditUtils](https://github.com/lrzjason/Comfyui-QwenEditUtils) | A collection of utility nodes for Qwen-based image editing in ComfyUI. |
| `comfyui-ic-light` | [ComfyUI-IC-Light](https://github.com/kijai/ComfyUI-IC-Light) | ComfyUI native nodes for IC-Light |
| `comfyui-post-processing-nodes` | [ComfyUI-post-processing-nodes](https://github.com/EllangoK/ComfyUI-post-processing-nodes) | A collection of post processing nodes for ComfyUI, which enable a variety of visually striking image effects |
| `bjornulf_custom_nodes` | [Bjornulf_custom_nodes](https://github.com/justUmen/Bjornulf_custom_nodes) | 170 ComfyUI nodes : Display, manipulate, and edit text, images, videos, loras, generate characters and more. Manage looping operations, generate randomized content, use logical conditions and work with external AI tools, like Ollama or Text To Speech, etc... |
| `crt-nodes` | [CRT-Nodes](https://github.com/plugcrypt/CRT-Nodes) | CRT-Nodes is a collection of custom nodes for ComfyUI |
| `comfyui-get-meta` | [comfyui-get-meta](https://github.com/shinich39/comfyui-get-meta) | Get metadata from image. |
| `comfyui-unload-model` | [ComfyUI-Unload-Model](https://github.com/SeanScripts/ComfyUI-Unload-Model) | For unloading a model or all models, using the memory management that is already present in ComfyUI. Copied from [a/https://github.com/willblaschko/ComfyUI-Unload-Models](https://github.com/willblaschko/ComfyUI-Unload-Models) but without the unnecessary extra stuff. |
| `Comfyui-Resolution-Master` | [Comfyui-Resolution-Master](https://github.com/Azornes/Comfyui-Resolution-Master) | ResolutionMaster is for total control over resolution and aspect ratio. It provides an intuitive interface with an interactive canvas, advanced scaling options, extensive presets (SDXL, Flux, WAN), and model-specific optimizations for high-quality AI image generation. |
| `comfyui-dream-project` | [comfyui-dream-project](https://github.com/alt-key-project/comfyui-dream-project) | This extension offers various nodes that are useful for Deforum-like animations in ComfyUI. |
| `comfyui_patches_ll` | [ComfyUI_Patches_ll](https://github.com/lldacing/ComfyUI_Patches_ll) | Some patches for Flux\|HunYuanVideo\|LTXVideo\|MochiVideo\|WanVideo etc, support TeaCache, PuLID, First Block Cache. |
| `ComfyUI-WanAnimatePreprocess` | [ComfyUI-WanAnimatePreprocess](https://github.com/kijai/ComfyUI-WanAnimatePreprocess) | ComfyUI nodes for WanAnimate input processing |
| `comfyui-fluxtrainer` | [ComfyUI-FluxTrainer](https://github.com/kijai/ComfyUI-FluxTrainer) | Currently supports LoRA training, and untested full finetune with code from kohya's scripts: [a/https://github.com/kohya-ss/sd-scripts](https://github.com/kohya-ss/sd-scripts) |
| `cg-image-filter` | [cg-image-filter](https://github.com/chrisgoringe/cg-image-filter) | A set of custom nodes that pause a workflow while you select images, add masks, or edit text. |
| `comfyui-sam2` | [ComfyUI-SAM2](https://github.com/neverbiasu/ComfyUI-SAM2) | This project adapts the SAM2 to incorporate functionalities from [a/comfyui_segment_anything](https://github.com/storyicon/comfyui_segment_anything). Many thanks to continue-revolution for their foundational work. |
| `comfyui-automaticcfg` | [ComfyUI-AutomaticCFG](https://github.com/Extraltodeus/ComfyUI-AutomaticCFG) | My own version 'from scratch' of a self-rescaling CFG. It isn't much but it's honest work. TLDR: set your CFG at 8 to try it. No burned images and artifacts anymore. CFG is also a bit more sensitive because it's a proportion around 8. Low scale like 4 also gives really nice results since your CFG is not the CFG anymore. Also in general even with relatively low settings it seems to improve the quality. |
| `comfyui-lora-auto-trigger-words` | [ComfyUI-Lora-Auto-Trigger-Words](https://github.com/idrirap/ComfyUI-Lora-Auto-Trigger-Words) | The aim of these custom nodes is to get an easy access to the tags used to trigger a lora / lycoris. Extract the tags from civitai or from the safetensors metadatas when available. |
| `comfyui-mvadapter` | [ComfyUI-MVAdapter](https://github.com/huanngzh/ComfyUI-MVAdapter) | This extension integrates [a/MV-Adapter](https://github.com/huanngzh/MV-Adapter) into ComfyUI, allowing users to generate multi-view consistent images from text prompts or single images directly within the ComfyUI interface. |
| `comfyui-ppm` | [ComfyUI-ppm](https://github.com/pamparamm/ComfyUI-ppm) | Fixed AttentionCouple, NegPip(negative weights in prompts) for SDXL, FLUX and HunyuanVideo, more CFG++ and SMEA DY samplers, etc. |
| `comfyui_smznodes` | [ComfyUI_smZNodes](https://github.com/shiimizu/ComfyUI_smZNodes) | Nodes such as CLIP Text Encode++ to achieve identical embeddings from stable-diffusion-webui for ComfyUI. |
| `comfyui_image_metadata_extension` | [comfyui_image_metadata_extension](https://github.com/edelvarden/comfyui_image_metadata_extension) | Custom node for ComfyUI. It adds additional metadata for saved images, ensuring compatibility with the Civitai website. |
| `bizyair` | [☁️BizyAir](https://github.com/siliconflow/BizyAir) | [a/BizyAir](https://github.com/siliconflow/BizyAir) Comfy Nodes that can run in any environment. |
| `comfyui-enricos-nodes` | [ComfyUI-enricos-nodes](https://github.com/erosDiffusion/ComfyUI-enricos-nodes) | pass up to 8 images and visually place, rotate and scale them to build the perfect composition. group move and group rescale. remember their position and scaling value across generations to easy swap images. use the buffer zone to to park an asset you don't want to use or easily reach transformations controls |
| `comfyui-propost` | [comfyui-propost](https://github.com/digitaljohn/comfyui-propost) | A set of custom ComfyUI nodes for performing basic post-processing effects including Film Grain and Vignette. These effects can help to take the edge off AI imagery and make them feel more natural. |
| `ComfyUI-Copilot` | [ComfyUI-Copilot](https://github.com/AIDC-AI/ComfyUI-Copilot) | Your Intelligent Assistant for Comfy-UI. |
| `janus-pro` | [ComfyUI-Janus-Pro](https://github.com/CY-CHENYUE/ComfyUI-Janus-Pro) | ComfyUI nodes for Janus-Pro, a unified multimodal understanding and generation framework. |
| `kaytool` | [KayTool](https://github.com/kk8bit/kaytool) | KayTool boosts ComfyUI workflow efficiency with powerful tools like: image processing (resize, color, blur, expand, merge, crop), background/mask tasks via BiRefNet/RemBG, wireless data transfer (Set&Get), AI translation (Tencent/Baidu), Professional high-precision resource monitoring, dynamic math operations, flexible text handling, precision sliders, metadata/color profile-supported image saving, batch processing via folder loading, canvas node map export as PNG with metadata, quick Run options via right-click, node alignment toolbar with custom styles, and custom ComfyUI logo integration. |
| git-only — [LanPaint](https://github.com/scraed/LanPaint) | [LanPaint](https://github.com/scraed/LanPaint) | Achieve seamless inpainting results without needing a specialized inpainting model. |
| `comfyui_lg_tools` | [Comfyui_LG_Tools](https://github.com/LAOGOU-666/Comfyui_LG_Tools) | This is a toolset designed for ComfyUI by LAOGOU-666, providing a series of practical image processing and operation nodes, making our operation more intuitive and convenient |
| `ComfyUI-WanStartEndFramesNative` | [ComfyUI-WanStartEndFramesNative](https://github.com/Flow-two/ComfyUI-WanStartEndFramesNative) | Start and end frames video generation node that supports native ComfyUI. |
| `comfyui-styles_csv_loader` | [ComfyUI-Styles_CSV_Loader](https://github.com/theUpsider/ComfyUI-Styles_CSV_Loader) | This extension allows users to load styles from a CSV file, primarily for migration purposes from the automatic1111 Stable Diffusion web UI. |
| git-only — [comfyui_essentials_mb](https://github.com/MinorBoy/ComfyUI_essentials_mb) | [ComfyUI_essentials_mb](https://github.com/MinorBoy/ComfyUI_essentials_mb) | Essential nodes. Fork from ComfyUI_essentials |
| git-only — [ComfyUI-Apt_Preset](https://github.com/cardenluo/ComfyUI-Apt_Preset.git) | [ComfyUI-Apt_Preset](https://github.com/cardenluo/ComfyUI-Apt_Preset.git) | ComfyUI Preset Manager, supporting various preset templates and workflow management |
| git-only — [seedvarianceenhancer](https://github.com/ChangeTheConstants/SeedVarianceEnhancer) | [SeedVarianceEnhancer](https://github.com/ChangeTheConstants/SeedVarianceEnhancer) | A ComfyUI custom node that adds diversity to Z-Image Turbo outputs by adding random noise to text embeddings. |
| `comfyui-itools` | [ComfyUI-iTools](https://github.com/MohammadAboulEla/ComfyUI-iTools) | Whether you're a casual user or a power user, iTools provides the quality-of-life improvements you need to make your ComfyUI experience more efficient and enjoyable. |
| `skimmed_cfg` | [Skimmed_CFG](https://github.com/Extraltodeus/Skimmed_CFG) | A powerful anti-burn allowing much higher CFG scales for latent diffusion models (for ComfyUI) |

## Workflow / UI utilities

| id / install | Name | Description |
|--------------|------|-------------|
| `ComfyUI-Crystools` | [ComfyUI-Crystools](https://github.com/crystian/ComfyUI-Crystools) | With this suit, you can see the resources monitor, progress bar & time elapsed, metadata and compare between two images, compare between two JSONs, show any value to console/display, pipes, and more! This provides better nodes to load/save images, previews, etc, and see "hidden" data without loading a new workflow. |
| `comfyui-multigpu` | [ComfyUI-MultiGPU](https://github.com/pollockjj/ComfyUI-MultiGPU) | Provides a suite of custom nodes to manage multiple GPUs for ComfyUI, including advanced model offloading for both GGUF and Safetensor formats with DisTorch, and bespoke MultiGPU support for WanVideoWrapper and other custom nodes. |
| `comfyui-rmbg` | [ComfyUI-RMBG](https://github.com/1038lab/ComfyUI-RMBG) | A sophisticated ComfyUI custom node engineered for advanced image background removal and precise segmentation of objects, faces, clothing, and fashion elements. This tool leverages a diverse array of models, including RMBG-2.0, INSPYRENET, BEN, BEN2, BiRefNet, SDMatte models, SAM, SAM2, SAM3 and GroundingDINO, while also incorporating a new feature for real-time background replacement and enhanced edge detection for improved accuracy. |
| `comfyui-detail-daemon` | [ComfyUI-Detail-Daemon](https://github.com/Jonseed/ComfyUI-Detail-Daemon) | A port of muerrilla's sd-webui-Detail-Daemon as a node for ComfyUI, to adjust sigmas that generally enhance details, and possibly remove unwanted bokeh or background blurring. |
| git-only — [comfyui-lora-manager](https://github.com/willmiao/ComfyUI-Lora-Manager) | [ComfyUI-Lora-Manager](https://github.com/willmiao/ComfyUI-Lora-Manager) | Revolutionize your workflow with the ultimate LoRA companion for ComfyUI! |
| `comfyui-jakeupgrade` | [ComfyUI-JakeUpgrade](https://github.com/jakechai/ComfyUI-JakeUpgrade) | ComfyUI workflow customization by Jake. |
| `comfyui_memory_cleanup` | [Comfyui-Memory_Cleanup](https://github.com/LAOGOU-666/Comfyui-Memory_Cleanup) | A ComfyUI extension that provides nodes for memory cleanup, including VRAM and RAM cleanup functions to optimize ComfyUI performance during long running workflows. |
| git-only — [comfyui-logic](https://github.com/theUpsider/ComfyUI-Logic) | [ComfyUI-Logic](https://github.com/theUpsider/ComfyUI-Logic) | An extension to ComfyUI that introduces logic nodes and conditional rendering capabilities. |

## Data handling

| id / install | Name | Description |
|--------------|------|-------------|
| `derfuu_comfyui_moddednodes` | [Derfuu_ComfyUI_ModdedNodes](https://github.com/Derfuu/Derfuu_ComfyUI_ModdedNodes) | Automate calculation depending on image sizes or something you want. |
| `basic_data_handling` | [Basic data handling](https://github.com/StableLlama/ComfyUI-basic_data_handling) | Basic Python functions for manipulating data that every programmer is used to, lightweight with no additional dependencies. Supported data types: - ComfyUI native: BOOLEAN, FLOAT, INT, STRING, and data lists - Python types as custom data types: DICT, LIST, SET, DATETIME, TIMEDELTA - PyTorch: TENSOR Feature categories: - Boolean logic operations - Type casting/conversion between all supported data types - Comparison operations - Data container manipulation - Flow control (conditionals, branching, execution order) - Mathematical operations - Mathematical formula node in a safe implementation - String manipulation - File system path handling, including STRING, IMAGE and MASK load and save - SET operations - time and date handling - PyTorch Tensor manipulation (arithmetic, slicing, reshaping) |

## Quantization / memory

| id / install | Name | Description |
|--------------|------|-------------|
| `ComfyUI-GGUF` | [ComfyUI-GGUF](https://github.com/city96/ComfyUI-GGUF) | GGUF Quantization support for native ComfyUI models. |
| `gguf` | [gguf](https://github.com/calcuis/gguf) | gguf node for comfyui |
| `ComfyUI-UltimateSDUpscale-GGUF` | [ComfyUI-UltimateSDUpscale-GGUF](https://github.com/traugdor/ComfyUI-UltimateSDUpscale-GGUF) | Flux (GGUF) implementation for the ComfyUI Ultimate SD Upscale node. |

## Inference optimization

| id / install | Name | Description |
|--------------|------|-------------|
| `ComfyUI-nunchaku` | [ComfyUI-nunchaku](https://github.com/nunchaku-tech/ComfyUI-nunchaku) | Nunchaku ComfyUI Node. Nunchaku is a high-performance inference engine optimized for low-bit neural networks. See more details: https://github.com/nunchaku-tech/nunchaku |
| `teacache` | [ComfyUI-TeaCache](https://github.com/welltop-cn/ComfyUI-TeaCache) | Unofficial implementation of [ali-vilab/TeaCache](https://github.com/ali-vilab/TeaCache) for ComfyUI |
| `wanblockswap` | [ComfyUI-wanBlockswap](https://github.com/orssorbit/ComfyUI-wanBlockswap) | This is a simple Wan block swap node for ComfyUI native nodes, works by swapping upto 40 blocks to the CPU to reduce VRAM. |
| git-only — [wavespeed](https://github.com/chengzeyi/Comfy-WaveSpeed) | [Comfy-WaveSpeed](https://github.com/chengzeyi/Comfy-WaveSpeed) | The all in one inference optimization solution for ComfyUI, universal, flexible, and fast. |

## ControlNet / conditioning

| id / install | Name | Description |
|--------------|------|-------------|
| `comfyui_controlnet_aux` | [comfyui_controlnet_aux](https://github.com/Fannovel16/comfyui_controlnet_aux) | Plug-and-play ComfyUI node sets for making ControlNet hint images |
| `controlaltai-nodes` | [ControlAltAI_Nodes](https://github.com/gseth/ControlAltAI-Nodes) | Quality of Life Nodes from ControlAltAI. Flux Resolution Calculator, Flux Sampler, Flux Union ControlNet Apply, Noise Plus Blend, Boolean Logic, and Flux Region Nodes. |

## Image restoration / upscaling

| id / install | Name | Description |
|--------------|------|-------------|
| `comfyui_ultimatesdupscale` | [ComfyUI_UltimateSDUpscale](https://github.com/ssitu/ComfyUI_UltimateSDUpscale) | ComfyUI nodes for the Ultimate Stable Diffusion Upscale script by Coyote-A. |
| `seedvr2_videoupscaler` | [ComfyUI-SeedVR2_VideoUpscaler](https://github.com/numz/ComfyUI-SeedVR2_VideoUpscaler) | SeedVR2 official ComfyUI integration: ByteDance-Seed's one-step diffusion-based video/image upscaling with memory-efficient inference |
| `comfyui_ttp_toolset` | [Comfyui_TTP_Toolset](https://github.com/TTPlanetPig/Comfyui_TTP_Toolset) | This is a workflow for my simple logic amazing upscale node for DIT model. it can be common use for Flux,Hunyuan,SD3 It can simple tile the initial image into pieces and then use image-interrogator to get each tile prompts for more accurate upscale process. The condition will be properly handled and the hallucination will be significantly eliminated. |
| `comfyui-supir` | [ComfyUI-SUPIR](https://github.com/kijai/ComfyUI-SUPIR) | Wrapper nodes to use SUPIR upscaling process in ComfyUI |

## Segmentation / masking

| id / install | Name | Description |
|--------------|------|-------------|
| `comfyui-inpaint-cropandstitch` | [ComfyUI-Inpaint-CropAndStitch](https://github.com/lquesada/ComfyUI-Inpaint-CropAndStitch) | The '✂️ Inpaint Crop' and '✂️ Inpaint Stitch' nodes enable inpainting only on masked area very easily: crop the image around the masked area with the Crop node, then use any standard workflow for sampling, then connect the sampled image to the Stitch node, which will put it back in place in the original image. These nodes enable faster sampling of smaller areas and take care of downsampling and upsampling to fit specific model and resource needs. |
| `comfyui-segment-anything-2` | [ComfyUI-segment-anything-2](https://github.com/kijai/ComfyUI-segment-anything-2) | Nodes to use [a/segment-anything-2](https://github.com/facebookresearch/segment-anything-2) for image or video segmentation. |
| `comfyui-inspyrenet-rembg` | [ComfyUI-Inspyrenet-Rembg](https://github.com/john-mnz/ComfyUI-Inspyrenet-Rembg) | ComfyUI node for background removal implementing [a/InSPyReNet](https://github.com/plemeri/InSPyReNet) |
| `comfyui_birefnet_ll` | [ComfyUI_BiRefNet_ll](https://github.com/lldacing/ComfyUI_BiRefNet_ll) | Sync with version of BiRefNet. NODES:AutoDownloadBiRefNetModel, LoadRembgByBiRefNetModel, RembgByBiRefNet, RembgByBiRefNetAdvanced, GetMaskByBiRefNet, BlurFusionForegroundEstimation. |

## Face / portrait / body

| id / install | Name | Description |
|--------------|------|-------------|
| `comfyui-reactor` | [ComfyUI-ReActor](https://github.com/Gourieff/ComfyUI-ReActor) | (SFW-Friendly) The Fast and Simple Face Swap Extension Node for ComfyUI, based on ReActor SD-WebUI Face Swap Extension |
| `comfyui-advancedliveportrait` | [ComfyUI-AdvancedLivePortrait](https://github.com/PowerHouseMan/ComfyUI-AdvancedLivePortrait) | AdvancedLivePortrait with Facial expression editor |
| `comfyui_pulid_flux_ll` | [ComfyUI_PuLID_Flux_ll](https://github.com/lldacing/ComfyUI_PuLID_Flux_ll) | The implementation for PuLID-Flux, support use with TeaCache and WaveSpeed, no model pollution. |
| git-only — [comfyui_instantid](https://github.com/cubiq/ComfyUI_InstantID) | [ComfyUI_InstantID](https://github.com/cubiq/ComfyUI_InstantID) | Native InstantID support for ComfyUI. This extension differs from the many already available as it doesn't use diffusers but instead implements InstantID natively and it fully integrates with ComfyUI. |
| `comfyui_faceanalysis` | [ComfyUI_FaceAnalysis](https://github.com/cubiq/ComfyUI_FaceAnalysis) | This extension uses DLib or InsightFace to calculate the vicinity between two faces and to perform other operation on faces. |
| `pulid_comfyui` | [PuLID_ComfyUI](https://github.com/cubiq/PuLID_ComfyUI) | PuLID ComfyUI native implementation. |
| `comfyui-liveportraitkj` | [ComfyUI-LivePortraitKJ](https://github.com/kijai/ComfyUI-LivePortraitKJ) | Nodes for [a/LivePortrait](https://github.com/KwaiVGI/LivePortrait) |

## LLM / vision-language

| id / install | Name | Description |
|--------------|------|-------------|
| `comfyui-florence2` | [ComfyUI-Florence2](https://github.com/kijai/ComfyUI-Florence2) | Nodes to use Florence2 VLM for image vision tasks: object detection, captioning, segmentation and ocr |
| `comfyui-ollama` | [comfyui-ollama](https://github.com/stavsap/comfyui-ollama) | Custom ComfyUI Nodes for interacting with [a/Ollama](https://ollama.com/) using the [a/ollama python client](https://github.com/ollama/ollama-python). Integrate the power of LLMs into CompfyUI workflows easily. |
| `mikey_nodes` | [mikey_nodes](https://github.com/bash-j/mikey_nodes) | Collection of convenient nodes. Wildcard, style, image, llm, haldclut, metadata, and more. |
| `comfyui_slk_joy_caption_two` | [ComfyUI_SLK_joy_caption_two](https://github.com/EvilBT/ComfyUI_SLK_joy_caption_two) | NODES:Joy Caption Two, Joy Caption Two Advanced, Joy Caption Two Load, Joy Caption Extra Options |
| `comfyui_llm_party` | [comfyui_LLM_party](https://github.com/heshengtao/comfyui_LLM_party) | A set of block-based LLM agent node libraries designed for ComfyUI.This project aims to develop a complete set of nodes for LLM workflow construction based on comfyui. It allows users to quickly and conveniently build their own LLM workflows and easily integrate them into their existing SD workflows. |

## Image / prompt utilities

| id / install | Name | Description |
|--------------|------|-------------|
| git-only — [promptmodels](https://github.com/cdanielp/COMFYUI_PROMPTMODELS) | [PromptModels Studio](https://github.com/cdanielp/COMFYUI_PROMPTMODELS) | Custom nodes for ComfyUI by PROMPTMODELS. Includes Google AI (Gemini · Nano Banana · Imagen 4 · Veo 3.1), Grok V2.0, Logic Utils, and Conflict-Free Set/Get Nodes. |
| git-only — [prompt-assistant](https://github.com/yawiii/ComfyUI-Prompt-Assistant) | [Prompt Assistant](https://github.com/yawiii/ComfyUI-Prompt-Assistant) | 提示词小助手可以一键调用GLM、gemini、ChatGPT、Grok、Qwen等在线大模型以及本地Ollama大模型。实现提示词、markdown节点翻译、润色扩写、图片视频反推。支持提示词预设实现一键插入、历史提示词查找等功能。是一个全能型提示词插件。This prompt assistant plugin supports one-click access to online LLMs including GLM, Gemini, ChatGPT, Grok, Qwen, and local Ollama models. It provides prompt generation, Markdown node translation, polishing, expansion, image and video prompt reverse engineering, and more. The plugin also features prompt presets for one‑click insertion and prompt history search, making it an all‑in‑one prompt utility for ComfyUI. |

## Video generation

| id / install | Name | Description |
|--------------|------|-------------|
| `comfyui-videohelpersuite` | [ComfyUI-VideoHelperSuite](https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite) | Load, save, preview, and batch video frames in ComfyUI. Essential for any video workflow — handles frame splitting, combining, and format conversion. |
| `ComfyUI-WanVideoWrapper` | [ComfyUI-WanVideoWrapper](https://github.com/kijai/ComfyUI-WanVideoWrapper) | ComfyUI wrapper nodes for WanVideo |
| `comfyui-frame-interpolation` | [ComfyUI-Frame-Interpolation](https://github.com/Fannovel16/ComfyUI-Frame-Interpolation) | A custom node suite for Video Frame Interpolation in ComfyUI |
| `comfyui-hunyuanvideowrapper` | [ComfyUI-HunyuanVideoWrapper](https://github.com/kijai/ComfyUI-HunyuanVideoWrapper) | ComfyUI diffusers wrapper nodes for [a/HunyuanVideo](https://github.com/Tencent/HunyuanVideo) |
| git-only — [comfyui-mmaudio](https://github.com/kijai/ComfyUI-MMAudio) | [ComfyUI-MMAudio](https://github.com/kijai/ComfyUI-MMAudio) | Nodes to generate audio for vide with: [a/https://github.com/hkchengrex/MMAudio](https://github.com/hkchengrex/MMAudio) |
| `comfyui-dream-video-batches` | [comfyui-dream-video-batches](https://github.com/alt-key-project/comfyui-dream-video-batches) | Provide utilities for batch based video generation workflows (s.a. AnimateDiff and Stable Video Diffusion). |
| `comfyui-cogvideoxwrapper` | [ComfyUI-CogVideoXWrapper](https://github.com/kijai/ComfyUI-CogVideoXWrapper) | Diffusers wrapper for CogVideoX -models: https://github.com/THUDM/CogVideo |
| `ComfyUI-FramePackWrapper_PlusOne` | [ComfyUI-FramePackWrapper_PlusOne](https://github.com/xhiroga/ComfyUI-FramePackWrapper_PlusOne) | An improved wrapper for the FramePack project that allows the creation of videos of any length based on reference images and LoRAs with F1 and 1-frame inference. |

## Audio / speech

| id / install | Name | Description |
|--------------|------|-------------|
| `ComfyUI-MelBandRoFormer` | [ComfyUI-MelBandRoFormer](https://github.com/kijai/ComfyUI-MelBandRoFormer) | ComfyUI wrapper nodes for WanVideo |
| `audio-separation-nodes-comfyui` | [audio-separation-nodes-comfyui](https://github.com/christian-byrne/audio-separation-nodes-comfyui) | Separate audio track into stems (vocals, bass, drums, other). Along with tools to recombine, tempo match, slice/crop audio |

## 3D / mesh

| id / install | Name | Description |
|--------------|------|-------------|
| `ComfyUI-3D-Pack` | [ComfyUI-3D-Pack](https://github.com/MrForExample/ComfyUI-3D-Pack) | Make ComfyUI generates 3D assets as good & convenient as it generates image/video! |

---
