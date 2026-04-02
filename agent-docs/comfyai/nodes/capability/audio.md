# Audio

Audio loading, separation, TTS, music generation

Sorted by number of matching nodes (most relevant first).

- `comfyui_fill-nodes` — [ComfyUI_Fill-Nodes](https://github.com/filliptm/ComfyUI_Fill-Nodes) *(16 nodes)*: AudioFrameCalculator, Audio_BPM_Analyzer, Audio_Beat_Visualizer, Audio_Crop, Audio_Drum_Detector, Audio_Envelope_Visualizer, Audio_Music_Video_Sequencer, Audio_Reactive_Brightness, Audio_Reactive_Edge_Glow, Audio_Reactive_Envelope, Audio_Reactive_Saturation, Audio_Reactive_Scale, Audio_Reactive_Speed, Audio_Segment_Extractor, Audio_Separation, Audio_Shot_Iterator
- `bjornulf_custom_nodes` — [Bjornulf_custom_nodes](https://github.com/justUmen/Bjornulf_custom_nodes) *(8 nodes)*: AudioPreview, AudioVideoSync, CombineVideoAudio, KokoroTTS, PlayAudio, SaveTmpAudio, SpeechToText, TextToSpeech
- `ComfyUI-WanVideoWrapper` — [ComfyUI-WanVideoWrapper](https://github.com/kijai/ComfyUI-WanVideoWrapper) *(7 nodes)*: NormalizeAudioLoudness, OviMMAudioVAELoader, AddOviAudioToLatents, DecodeOviAudio, EmptyMMAudioLatents, EncodeOviAudio, ImageToVideoSkyreelsv3_audio
- `audio-separation-nodes-comfyui` — [audio-separation-nodes-comfyui](https://github.com/christian-byrne/audio-separation-nodes-comfyui) *(7 nodes)*: AudioCombine, AudioCrop, AudioGetTempo, AudioSeparation, AudioSpeedShift, AudioTempoMatch, AudioVideoCombine
- `comfyui-kjnodes` — [ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes) *(6 nodes)*: AudioConcatenate, CreateAudioMask, LTX2AudioLatentNormalizingSampling, LTXVAudioVideoMask, PlaySoundKJ, SoundReactive
- `crt-nodes` — [CRT-Nodes](https://github.com/plugcrypt/CRT-Nodes) *(6 nodes)*: AudioCompressor, AudioFrameAdjuster, AudioLoaderCrawl, AudioOrManualFrameCount, AudioPreviewer, SaveAudioWithPath
- `comfyui-videohelpersuite` — [ComfyUI-VideoHelperSuite](https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite) *(4 nodes)*: AudioToVHSAudio, LoadAudio, LoadAudioUpload, VHSAudioToAudio
- git-only ([install guide](../hiddenswitch/install-custom-nodes.md)) — [ComfyUI-MMAudio](https://github.com/kijai/ComfyUI-MMAudio) *(4 nodes)*: MMAudioFeatureUtilsLoader, MMAudioModelLoader, MMAudioSampler, MMAudioVoCoderLoader
- `comfyui_llm_party` — [comfyui_LLM_party](https://github.com/heshengtao/comfyui_LLM_party) *(4 nodes)*: FeishuDownloadAudio, fish_tts, listen_audio, openai_tts
- `comfyui-custom-scripts` — [ComfyUI-Custom-Scripts](https://github.com/pythongosssss/ComfyUI-Custom-Scripts): PlaySound
- `gguf` — [gguf](https://github.com/calcuis/gguf): AudioEncoderLoaderGGUF

---

To install a pack from this list:
```bash
cd {installDir}
uv pip install --extra-index-url https://nodes.appmana.com/simple/ <id>
```
Then restart the ComfyUI server.

← [Capability Index](index.md)
