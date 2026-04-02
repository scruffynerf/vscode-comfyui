# Text / Prompts

String manipulation, prompt building, token counting, captioning

Sorted by number of matching nodes (most relevant first).

- `basic_data_handling` — [Basic data handling](https://github.com/StableLlama/ComfyUI-basic_data_handling) *(58 nodes)*: CastToString, DataListCreateFromString, DictCreateFromString, ListCreateFromString, PathLoadStringFile, PathSaveStringFile, SetCreateFromString, StringCapitalize, StringCasefold, StringCenter, StringComparison, StringConcat, StringCount, StringDataListJoin, StringDecode, StringEncode, StringEndswith, StringEscape, StringExpandtabs, StringFind, StringFormatMap, StringIn, StringIsAlnum, StringIsAlpha, StringIsAscii, StringIsDecimal, StringIsDigit, StringIsIdentifier, StringIsLower, StringIsNumeric, StringIsPrintable, StringIsSpace, StringIsTitle, StringIsUpper, StringLength, StringListJoin, StringLjust, StringLower, StringLstrip, StringRemoveprefix, StringRemovesuffix, StringReplace, StringRfind, StringRjust, StringRsplitDataList, StringRsplitList, StringRstrip, StringSplitDataList, StringSplitList, StringSplitlinesDataList, StringSplitlinesList, StringStartswith, StringStrip, StringSwapcase, StringTitle, StringUnescape, StringUpper, StringZfill
- `comfyui-easy-use` — [ComfyUI-Easy-Use](https://github.com/yolain/ComfyUI-Easy-Use) *(18 nodes)*: XYInputs: PromptSR, loraPromptApply, mathString, pipeEditPrompt, prompt, promptAwait, promptConcat, promptLine, promptList, promptReplace, saveText, saveTextLazy, string, stringJoinLines, stringToFloatList, stringToIntList, textIndexSwitch, textSwitch
- `comfyui-itools` — [ComfyUI-iTools](https://github.com/MohammadAboulEla/ComfyUI-iTools) *(8 nodes)*: iToolsPreviewText, iToolsPromptBuilder, iToolsPromptLoader, iToolsPromptRecord, iToolsPromptSaver, iToolsPromptStyler, iToolsPromptStylerExtra, iToolsTextReplacer
- `cg-image-filter` — [cg-image-filter](https://github.com/chrisgoringe/cg-image-filter) *(7 nodes)*: Any List to String, Split String by Commas, String List from Strings, String to Float, String to Int, Text Image Filter, Text Image Filter with Extras
- `rgthree-comfy` — [rgthree-comfy](https://github.com/rgthree/rgthree-comfy) *(4 nodes)*: PowerPrompt, PowerPromptSimple, SDXLPowerPromptPositive, SDXLPowerPromptSimple
- `comfyui_essentials` — [ComfyUI_essentials](https://github.com/cubiq/ComfyUI_essentials) *(3 nodes)*: CLIPTextEncodeSDXL+, DrawText+, TextEncodeForSamplerParams+
- `comfyui-ppm` — [ComfyUI-ppm](https://github.com/pamparamm/ComfyUI-ppm) *(3 nodes)*: CLIPTextEncodeBREAK, CLIPTextEncodeInvertWeights, CLIPTokenCounter
- `comfyui-get-meta` — [comfyui-get-meta](https://github.com/shinich39/comfyui-get-meta) *(2 nodes)*: GetPromptFromImage, GetStringFromImage
- `comfyui-lora-auto-trigger-words` — [ComfyUI-Lora-Auto-Trigger-Words](https://github.com/idrirap/ComfyUI-Lora-Auto-Trigger-Words) *(2 nodes)*: FusionText, TextInputBasic
- `kaytool` — [KayTool](https://github.com/kk8bit/kaytool) *(2 nodes)*: Strong_Prompt, Text
- `comfyui_controlnet_aux` — [comfyui_controlnet_aux](https://github.com/Fannovel16/comfyui_controlnet_aux): ControlNetAuxSimpleAddText
- `controlaltai-nodes` — [ControlAltAI_Nodes](https://github.com/gseth/ControlAltAI-Nodes): TextBridge
- `comfyui_smznodes` — [ComfyUI_smZNodes](https://github.com/shiimizu/ComfyUI_smZNodes): smZ CLIPTextEncode
- `comfyui_lg_tools` — [Comfyui_LG_Tools](https://github.com/LAOGOU-666/Comfyui_LG_Tools): TransformDataFromString

---

To install a pack from this list:
```bash
cd {installDir}
uv pip install --extra-index-url https://nodes.appmana.com/simple/ <id>
```
Then restart the ComfyUI server.

← [Capability Index](index.md)
