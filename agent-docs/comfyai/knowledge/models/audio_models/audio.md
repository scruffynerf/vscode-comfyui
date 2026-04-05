# Audio Models

Reference for audio generation and synchronization models. These add audio to video or generate audio from conditioning. All require WanVideoWrapper (Kijai) custom node unless noted.

---

## MMAudio — video-to-audio generation

In `available-models.json` → `mmaudio`. Generates audio synchronized to video content.

| Model | Notes |
|---|---|
| `mmaudio/mmaudio_vae_16k_bf16.safetensors` | MMAudio VAE (required) |
| `mmaudio/mmaudio_vocoder_bigvgan_best_netG_bf16.safetensors` | BigVGAN vocoder (required) |

Both files are required together. MMAudio analyzes video frames and generates matching audio — footsteps, ambient sound, music-adjacent textures.

---

## Audio encoders (Whisper-based)

In `available-models.json` → `audio_encoders`. Used for audio-driven video generation (lip sync, motion from audio).

| Model | Notes |
|---|---|
| `whisper_large_v3_encoder_fp16.safetensors` | Whisper Large V3 encoder |
| `whisper_large_v3_fp16.safetensors` | Alternative repackaged version |
| `wav2vec2_large_english_fp16.safetensors` | Wav2Vec2 (Wan 2.2 audio sync) |

Audio encoders extract speech/audio features that drive video generation (e.g., talking head workflows).

---

## Wav2Vec2 — speech feature extraction

In `available-models.json` → `wav2vec2`.

| Model | Notes |
|---|---|
| `wav2vec2-chinese-base_fp16.safetensors` | Chinese speech encoder for MultiTalk |

Used specifically for MultiTalk (Chinese speech → talking head video via Wan). Narrow use case.

---

## Choosing by task

| Task | Use |
|---|---|
| Add ambient/synchronized audio to generated video | MMAudio (both files required) |
| Lip-sync a talking head from audio | Whisper encoder + relevant custom node |
| Chinese speech-driven video | Wav2Vec2 (Chinese) |
