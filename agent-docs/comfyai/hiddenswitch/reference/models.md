# Model Registration and Downloading

**This is a reference document. Look up what you need — do not read the whole file.**

<!-- TODO: Expand with: list of commonly registered models by category, notes on which models require HF auth, CivitAI auth setup, model directory structure under installDir, disable_known_models for offline environments. -->

---

## Registering models for automatic download

`add_known_models` registers a model so that the **embedded Python client** (`Comfy` / `queue_prompt`) will download it automatically on first use — during the workflow run, not at registration time.

**Important**: `add_known_models` does NOT download the model immediately, and does NOT make the model visible to:
- The running ComfyUI server (panel dropdown lists won't include it until the next server start)
- The CLI (`comfyui run-workflow`)
- Any process other than the embedded client in the same Python session

**For panel use**: the hiddenswitch server has its own known-model list and will auto-download models on first use — when a workflow runs that references a model the server knows about. Check `comfyai/available-models.json` for the current list. If the model you need is already there, just reference it by name in your workflow and queue it — the server handles the download.

If a model is not in `available-models.json`, it is not in the server's known list. To add it for panel use: download it manually to `{installDir}/models/<folder>/` using `hf_hub_download` with `local_dir` set to that path, then restart the server. **Do not** use `add_known_models` for this — it only affects the embedded client.

To use `add_known_models`, call it before `client.queue_prompt()` in the same script:

```python
from comfy.model_downloader import add_known_models
from comfy.model_downloader_types import HuggingFile, CivitFile

# Basic Hugging Face model
add_known_models("checkpoints", HuggingFile(
    "stabilityai/stable-diffusion-v1-5",
    "v1-5-pruned-emaonly.safetensors"
))

# When the repo filename is generic, rename it on disk
add_known_models("controlnet", HuggingFile(
    "lllyasviel/control_v11p_sd15_canny",
    "diffusion_pytorch_model.safetensors",
    save_with_filename="control_v11p_sd15_canny.safetensors"
))

# Multiple models at once
add_known_models("diffusion_models",
    HuggingFile("black-forest-labs/FLUX.1-schnell", "flux1-schnell.safetensors"),
    HuggingFile("black-forest-labs/FLUX.1-dev", "flux1-dev.safetensors"),
)

# CivitAI
add_known_models("checkpoints", CivitFile(
    model_id=133005,
    model_version_id=357609,
    filename="juggernautXL_v9.safetensors"
))
```

Folder names match ComfyUI's model directory structure: `checkpoints`, `loras`, `controlnet`, `vae`, `clip`, `diffusion_models`, `upscale_models`.

---

## Downloading a model manually (for panel use)

Use this when a model is **not** in `comfyai/available-models.json` and you need it available in the panel.

```python
from huggingface_hub import hf_hub_download

hf_hub_download(
    repo_id="UPJeffW/Z-Image-Turbo-AIO",
    filename="z-image-turbo-fp8-aio.safetensors",
    local_dir="{installDir}/models/checkpoints",
)
```

Replace `repo_id`, `filename`, and the `local_dir` subfolder (`checkpoints`, `loras`, `vae`, `controlnet`, etc.) as appropriate. The file lands directly in that directory — no symlink, no HF cache involved.

After the download completes, restart the ComfyUI server. The model will appear in `available-models.json` on the next panel open.

**Note**: large models can take many minutes. There is no progress bar — check `user/comfyui.log` or the terminal for download activity. If you need auth for a gated model, set `HF_TOKEN` before running (see Gated models below).

---

## Where models are stored

Models downloaded via `add_known_models` go to `~/.cache/huggingface/hub/` (the Hugging Face cache) and are symlinked into `{installDir}/models/`. They are shared across all projects that use the same HF cache.

Models downloaded via `hf_hub_download` with `local_dir` go directly to that directory with no caching or symlinking.

---

## Gated models (FLUX, SD3, etc.)

Some models require accepting terms on Hugging Face before downloading. Set up auth before running any workflow that references them.

**Recommended**: set the environment variable before starting the server or running a script:

```bash
export HF_TOKEN=hf_your_token_here
```

ComfyUI and `huggingface_hub` both pick up `HF_TOKEN` automatically.

**Alternative** (if you want interactive login): `huggingface-cli login` — but this binary may not be installed in the venv by default. If it's missing, install it with `{venv}/bin/pip install "huggingface_hub[cli]"` or just use the env var instead.

---

## Disabling automatic downloads

```python
config = default_configuration()
config.disable_known_models = True
```

Or via CLI: `comfyui run-workflow --disable-known-models`.
