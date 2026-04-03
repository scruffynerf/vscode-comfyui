# Model Registration and Downloading

**This is a reference document. Look up what you need — do not read the whole file.**

<!-- TODO: Expand with: list of commonly registered models by category, notes on which models require HF auth, CivitAI auth setup, model directory structure under installDir, disable_known_models for offline environments. -->

---

## Registering models for automatic download

`add_known_models` registers a model so that the **embedded Python client** (`Comfy` / `queue_prompt`) will download it automatically on first use — during the workflow run, not at registration time.

**Important**: `add_known_models` does NOT download the model immediately, and does NOT make the model visible to:
- The running ComfyUI server (panel dropdown lists won't include it)
- The CLI (`comfyui run-workflow`)
- Any process other than the embedded client in the same Python session

If you need the model available in the panel or via CLI, the model file must already be on disk (in `{installDir}/models/<folder>/`). Check what's available by reading the server log or querying `/object_info/CheckpointLoaderSimple`.

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

## Where models are stored

Models download to `~/.cache/huggingface/hub/` (the Hugging Face cache) and are symlinked into `{installDir}/models/`. They are shared across all projects that use the same HF cache.

---

## Gated models (FLUX, SD3, etc.)

Some models require accepting terms on Hugging Face before downloading. Set up auth before running any workflow that references them:

```bash
export HF_TOKEN=hf_your_token_here
# or interactively:
huggingface-cli login
```

ComfyUI picks up `HF_TOKEN` automatically.

---

## Disabling automatic downloads

```python
config = default_configuration()
config.disable_known_models = True
```

Or via CLI: `comfyui run-workflow --disable-known-models`.
