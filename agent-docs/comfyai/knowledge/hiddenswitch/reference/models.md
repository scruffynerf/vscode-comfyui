# Model Registration and Downloading

**This is a reference document. Look up what you need — do not read the whole file.**

<!-- TODO: Expand with: list of commonly registered models by category, model directory structure under installDir, disable_known_models for offline environments. -->

---

## Checking if a model is already on disk

A model listed in `comfyai/available-models.json` may or may not be physically present on disk. The server's known-model list includes models it *can* download on demand — not only those already downloaded. If a model needs downloading, expect several minutes of wait time before generation begins.

**Check local model files** — look in the model subdirectories under `{installDir}/models/`:

```bash
ls {installDir}/models/checkpoints/
ls {installDir}/models/loras/
ls {installDir}/models/vae/
# etc.
```

These may be actual files or symlinks from the HF cache. Either way, if the file is present, the model loads immediately with no download.

**Check the HuggingFace cache** — models downloaded via `add_known_models` land in `~/.cache/huggingface/hub/` and are symlinked into `{installDir}/models/`. You can inspect the cache with:

```bash
{installDir}/{venv}/bin/huggingface-cli scan-cache
```

If `huggingface-cli` is not installed in the venv, install it first:
```bash
{installDir}/{venv}/bin/pip install "huggingface_hub[cli]"
```

**Estimate download size before committing** — if you suspect a model needs downloading, you can fetch its metadata from HuggingFace before running:

```python
from huggingface_hub import get_paths_info
info = list(get_paths_info("stabilityai/stable-diffusion-v1-5", ["v1-5-pruned-emaonly.safetensors"]))
if info:
    size_gb = info[0].size / 1e9
    print(f"Download size: {size_gb:.1f} GB")
```

Or use the HF API directly: `GET https://huggingface.co/api/models/<repo_id>` and look at the `siblings` array for `rfilename` / `size` fields.

---

## Registering models for automatic download

`add_known_models` registers a model so that the **embedded Python client** (`Comfy` / `queue_prompt`) will download it automatically on first use — during the workflow run, not at registration time.

**Important**: `add_known_models` does NOT download the model immediately, and does NOT make the model visible to:
- The running ComfyUI server (panel dropdown lists won't include it until the next server start)
- The CLI (`comfyui run-workflow`)
- Any process other than the embedded client in the same Python session

**For panel use**: the hiddenswitch server has its own known-model list and will auto-download models on first use — when a workflow runs that references a model the server knows about. Check `comfyai/available-models.json` for the current list. If the model you need is already there, just reference it by name in your workflow and queue it — the server handles the download.

If a model is not in `available-models.json`, it is not in the server's known list. There are two ways to add it:

**Option A — Register via `_extension/hiddenswitch/config/model-includes.json`**: edit `comfyai/_extension/hiddenswitch/config/model-includes.json` and add the model to the relevant folder array. The Python init node reads this file at server startup and calls `add_known_models`. The server will auto-download the model on first use. Restart the server after editing.

```json
{
  "diffusion_models": [
    { "source": "hf", "repo_id": "black-forest-labs/FLUX.1-dev", "filename": "flux1-dev.safetensors" }
  ]
}
```

The file has `_format` and `_examples` keys documenting the full syntax.

**Option B — Download manually**: download the model directly to `{installDir}/models/<folder>/` using `hf_hub_download`, then restart the server. This is better for models that aren't in HuggingFace or CivitAI.

**Do not** use `add_known_models` for panel use — it only affects the embedded Python client, not the running server.

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

Common gated repos: `black-forest-labs/FLUX.1-dev`, `stabilityai/stable-diffusion-3-medium`, `stabilityai/stable-diffusion-3.5-large`, `stabilityai/stable-diffusion-3.5-medium`, `stabilityai/stable-diffusion-3.5-large-turbo`.

---

## CivitAI models

`CivitFile` is supported in `add_known_models` alongside `HuggingFile`. The constructor takes:

```python
CivitFile(
    model_id=133005,           # integer from the CivitAI URL: civitai.com/models/<model_id>
    model_version_id=357609,   # integer: ?modelVersionId=<version_id> in the URL
    filename="juggernautXL_v9.safetensors",  # exact filename as it appears on CivitAI
    trigger_words=["juggernaut"],  # optional, informational only — not used by the downloader
    alternate_filenames=("sdxl/juggernautXL_v9.safetensors",),  # optional
)
```

**Finding IDs from a CivitAI URL**: a model page URL like `https://civitai.com/models/133005?modelVersionId=357609` gives you both integers directly.

**Authentication**: the hiddenswitch downloader makes unauthenticated requests to the CivitAI API and download endpoint. There is no `CIVITAI_API_TOKEN` support built in. Most publicly-listed, non-gated CivitAI models download fine without auth. Models that are marked "early access", NSFW-restricted, or creator-gated will fail — the download URL will either redirect to a login page or return an error, and the model will not be saved. If you need a gated CivitAI model, download it manually:

```bash
# Find the direct download URL from the CivitAI model page (right-click → copy link on the Download button)
curl -L "https://civitai.com/api/download/models/357609?token=YOUR_CIVITAI_TOKEN" \
     -o "{installDir}/models/checkpoints/juggernautXL_v9.safetensors"
```

Then restart the server so the panel picks it up.

---

## Removing models from the server's known list

To prevent the server from downloading or offering a specific model, add its filename to `comfyai/_extension/hiddenswitch/config/model-veto.json`:

```json
{
  "filenames": [
    "sd_xl_turbo_1.0.safetensors",
    "dreamshaper_8.safetensors"
  ]
}
```

Filenames must match exactly as they appear in `comfyai/available-models.json`. Takes effect on next server restart.

---

## Disabling automatic downloads

```python
config = default_configuration()
config.disable_known_models = True
```

Or via CLI: `comfyui run-workflow --disable-known-models`.

This disables all automatic model downloads for the embedded client only. The server's known-model list is unaffected.
