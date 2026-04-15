# LoRA / Embeddings

LoRA loading, stacking, trigger words, textual inversion

> **These packs may not be installed in your environment.** Cross-check `node-registry.json` before using any node — see Step 1 in [find-a-node.md](../find-a-node.md).

Sorted by number of matching nodes (most relevant first).

- `comfyui-kjnodes` — [ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes) *(10 nodes)*: DiTBlockLoraLoader, FluxBlockLoraSelect, HunyuanVideoBlockLoraSelect, ImagePrepForICLora, Intrinsic_lora_sampling, LTX2BlockLoraSelect, LTX2LoraLoaderAdvanced, LoraExtractKJ, LoraReduceRankKJ, Wan21BlockLoraSelect
- git-only ([install guide](../../knowledge/hiddenswitch/install-custom-nodes.md)) — [ComfyUI-Lora-Manager](https://github.com/willmiao/ComfyUI-Lora-Manager) *(9 nodes)*: LoraCyclerLM, LoraLoaderLM, LoraPoolLM, LoraRandomizerLM, LoraStackCombinerLM, LoraStackerLM, LoraTextLoaderLM, WanVideoLoraSelectLM, WanVideoLoraTextSelectLM
- `bjornulf_custom_nodes` — [Bjornulf_custom_nodes](https://github.com/justUmen/Bjornulf_custom_nodes) *(9 nodes)*: APIGenerateCivitAIAddLORA, AllLoraSelector, CivitAILoraSelectorHunyuan, CivitAILoraSelectorPONY, CivitAILoraSelectorSD15, CivitAILoraSelectorSDXL, LoaderLoraWithPath, LoopLoraSelector, RandomLoraSelector
- `comfyui-easy-use` — [ComfyUI-Easy-Use](https://github.com/yolain/ComfyUI-Easy-Use) *(7 nodes)*: XYInputs: Lora, loraNames, loraPromptApply, loraStack, loraStackApply, loraSwitcher, makeImageForICLora
- `comfyui-lora-auto-trigger-words` — [ComfyUI-Lora-Auto-Trigger-Words](https://github.com/idrirap/ComfyUI-Lora-Auto-Trigger-Words) *(6 nodes)*: LoraListNames, LoraLoaderAdvanced, LoraLoaderStackedAdvanced, LoraLoaderStackedVanilla, LoraLoaderVanilla, LoraTagsOnly
- `comfyui-art-venture` — [ComfyUI ArtVenture](https://github.com/sipherxyz/comfyui-art-venture) *(5 nodes)*: LoraListLoader, LoraListStacker, LoraLoader, GetSAMEmbedding, SAMEmbeddingToImage
- `ComfyUI-WanVideoWrapper` — [ComfyUI-WanVideoWrapper](https://github.com/kijai/ComfyUI-WanVideoWrapper) *(4 nodes)*: LoraBlockEdit, LoraSelect, LoraSelectByName, LoraSelectMulti
- `was-ns` — [WAS Node Suite (Revised)](https://github.com/ltdrdata/was-node-suite-comfyui) *(3 nodes)*: Load Lora, Lora Input Switch, Lora Loader
- `crt-nodes` — [CRT-Nodes](https://github.com/plugcrypt/CRT-Nodes) *(3 nodes)*: FluxLoraBlocksPatcher, Lora Loader Str, WanVideoLoraSelectMultiImproved
- `comfyui_llm_party` — [comfyui_LLM_party](https://github.com/heshengtao/comfyui_LLM_party) *(3 nodes)*: easy_load_llm_lora, ic_lora_persona, load_llm_lora
- `rgthree-comfy` — [rgthree-comfy](https://github.com/rgthree/rgthree-comfy) *(2 nodes)*: LoraLoaderStack, PowerLoraLoader
- `ComfyUI-nunchaku` — [ComfyUI-nunchaku](https://github.com/nunchaku-tech/ComfyUI-nunchaku) *(2 nodes)*: NunchakuFluxLoraLoader, NunchakuFluxLoraStack
- `mikey_nodes` — [mikey_nodes](https://github.com/bash-j/mikey_nodes) *(2 nodes)*: LoraSyntaxProcessor, WildcardAndLoraSyntaxProcessor
- `comfyui-hunyuanvideowrapper` — [ComfyUI-HunyuanVideoWrapper](https://github.com/kijai/ComfyUI-HunyuanVideoWrapper) *(2 nodes)*: LoraBlockEdit, LoraSelect
- `comfyui-cogvideoxwrapper` — [ComfyUI-CogVideoXWrapper](https://github.com/kijai/ComfyUI-CogVideoXWrapper) *(2 nodes)*: LoraSelect, LoraSelectComfy
- `comfyui-custom-scripts` — [ComfyUI-Custom-Scripts](https://github.com/pythongosssss/ComfyUI-Custom-Scripts): LoraLoader
- `comfyui-florence2` — [ComfyUI-Florence2](https://github.com/kijai/ComfyUI-Florence2): DownloadAndLoadFlorence2Lora
- `comfyui_fill-nodes` — [ComfyUI_Fill-Nodes](https://github.com/filliptm/ComfyUI_Fill-Nodes): StringToLoraName
- `comfyui-mvadapter` — [ComfyUI-MVAdapter](https://github.com/huanngzh/ComfyUI-MVAdapter): CustomLoraModelLoader
- `ComfyUI-FramePackWrapper_PlusOne` — [ComfyUI-FramePackWrapper_PlusOne](https://github.com/xhiroga/ComfyUI-FramePackWrapper_PlusOne): FramePackLoraSelect

---

To install a pack from this list:
```bash
cd {installDir}
uv pip install --extra-index-url https://nodes.appmana.com/simple/ <id>
```
Then restart the ComfyUI server.

← [Capability Index](index.md)
