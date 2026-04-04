# Apple Silicon / MPS Performance

Read this file when working on an Apple Silicon machine. When you are done, return to your task.

---

## `--novram` is the recommended default, not a fallback

On Apple Silicon (M1/M2/M3/M4), all system memory is unified — there is no discrete VRAM. `--novram` tells ComfyUI to avoid pinning weights to the MPS device between operations, preventing memory pressure and swap. It is the correct setting for these machines by default.

Check `server-info.json` → `devices[0].vram_free` for current free unified memory. More free memory = faster generation. Closing other apps helps.

**CUDA benchmark numbers do not apply to MPS.** Do not use them as a reference for expected generation times.

---

## Expected generation times on M-series with `--novram`

| Workflow | Time |
|---|---|
| Flux Schnell FP8, 4 steps | ~30–120 seconds (varies with free memory) |
| Flux Schnell FP8, 20 steps | ~4–8 minutes — wasteful; use 4 steps instead |
| SDXL, 20 steps | ~2–4 minutes |

---

## Agent behavior rules

- If the user reports slow generation on MPS: check steps and model family first — Flux Schnell at 20 steps is a common cause. See `knowledge/models/model-settings.md`.
- Do not recommend CUDA-specific performance tuning flags on MPS machines.
- If `server-info.json` shows low `vram_free` (< 4 GB), note that closing other applications may improve generation time.
