# ACE-Step

Reference for ACE-Step, a music generation model. ACE-Step is an audio/music generation model, not an image generation model.

---

## What ACE-Step is

ACE-Step generates music and audio from text descriptions. It is a **diffusion-based audio model**, not a video or image model. It outputs audio waveforms.

---

## Model variants

<!-- TODO: Confirm exact filenames and ComfyUI categories. ACE-Step may not appear in the standard model categories — it may use a custom loader node and custom model directory. -->

| Filename | Notes |
|---|---|
| `ace_step_music_v1.safetensors` | Music generation model |

---

## Requirements

ACE-Step requires a custom node. Check `comfyai/nodes/node-registry.json` for available ACE-Step nodes after installing the relevant custom node.

The model likely does not appear in `available-models.json` unless the custom node is installed.

---

## Notes

- Input: text prompt describing the desired music (style, mood, instruments, tempo)
- Output: audio waveform (WAV or similar)
- ACE-Step is distinct from MMAudio (which adds audio to video) — ACE-Step generates music from scratch
- See `comfyai/knowledge/models/audio.md` for other audio models (MMAudio, Whisper, Wav2Vec2)

<!-- TODO: Add more details once ACE-Step custom node implementation is confirmed in ComfyUI ecosystem. -->
