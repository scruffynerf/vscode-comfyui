# ComfyAI — Hiddenswitch Mode

**Stop. Before going further, answer these questions.**

---

## Do you actually need this?

This directory covers using ComfyUI as a Python library — running workflows silently, testing code, building custom nodes. It does NOT modify the user's visible workflow. It does NOT show anything in their ComfyUI panel.

**Answer each question before proceeding:**

**1. What exactly did the user ask for?**
Quote their request to yourself. Does it involve:
- Running something and returning a result they can't see? → might be here
- Modifying their workflow or showing them something in the panel? → **stop, go back to [comfyai/README.md](../README.md)**
- Queuing or running the workflow that's already in the panel? → **stop, use `{"command": "queue"}` trigger in [comfyai/README.md](../README.md)** — this is NOT hiddenswitch
- Just asking what a node does or how their workflow works? → **stop, answer from `comfyai/workflow-summary.md`** (runtime file, not a link)

**2. Is the user expecting to SEE something in their ComfyUI panel?**
"Make me a photo of a puppy" is ambiguous. It might mean:
- Change my existing prompt node to generate a puppy → GUI bridge, not here
- Add the right nodes to my workflow so I can run it → GUI bridge, not here
- Generate a puppy image silently and return the path → here

"Run the workflow" is also ambiguous:
- Run it in the panel so I can see it execute → **GUI bridge `queue` command, not here**
- Run it silently and give me the output file path → here

If unclear: **ask the user** which they want before proceeding. Do not guess.

**3. Does the user need a node that doesn't exist yet?**
Before going to `node-development/`, check:
- [comfyai/nodes/find-a-node.md](../nodes/find-a-node.md) — there may be an existing or pip-installable node that does it already

Writing a custom node is the last resort, not the first instinct.

---

## If you're in the right place — pick your task

| Task | File |
|------|------|
| Run a workflow silently and get a result | [run-workflow.md](run-workflow.md) |
| Build a new workflow from scratch in Python | [graphbuilder.md](graphbuilder.md) |
| Write and test a new custom node | [node-development/README.md](node-development/README.md) |
| Install a custom node from the catalog or git | [install-custom-nodes.md](install-custom-nodes.md) |

For API details (configuration options, model downloading, output structure), see [reference/python-api.md](reference/python-api.md). This is a look-up reference, not a task doc — go there when a task doc tells you to, not directly.

---

## Installation context

The user's hiddenswitch install lives at the path in `comfyui.installDir` (check `.vscode/settings.json`).

```
{installDir}/
  {venv}/        ← Python with hiddenswitch installed (name set by comfyui.venvDir, default .venv)
  models/        ← Checkpoints, LoRAs, VAEs (symlinked from HF cache)
  output/        ← Generated images land here
  custom_nodes/  ← User's installed custom nodes
```

Run scripts using the venv Python:
```bash
{installDir}/{venv}/bin/python myscript.py
# or from installDir:
cd {installDir} && uv run python myscript.py
```

### Searching inside the venv

The `{venv}/` directory contains thousands of packages — don't scan it broadly. Go directly to what you need:

**Installed packages list** (is a package installed? what version?):
```bash
{installDir}/{venv}/bin/pip list | grep <name>
# or
{installDir}/{venv}/bin/python -c "import <pkg>; print(<pkg>.__version__)"
```

**ComfyUI source code** (node base classes, type definitions, etc.):
```
{venv}/lib/python3.x/site-packages/comfy/
```
To find the right python version:
```bash
ls {installDir}/{venv}/lib/
```

**Installed custom nodes** (pip-installed, not in `custom_nodes/`):
```
{venv}/lib/python3.x/site-packages/comfy_extras/
{venv}/lib/python3.x/site-packages/<package_name>/
```
Pip-installed custom nodes register themselves via entry points, not by being in `custom_nodes/`. Use `pip list` or check the package's entry point to find where the code lives — don't glob the whole site-packages tree.

**User-installed custom nodes** (git-cloned, not pip-installed):
```
{installDir}/custom_nodes/<node_name>/
```
These are the ones a user placed there manually or via the ComfyUI Manager. Always check here before `{venv}/`.

**Summary**: `{venv}/` is read-only context. Use `pip list` for package presence, targeted paths for source reading. Never glob or iterate the whole tree.
