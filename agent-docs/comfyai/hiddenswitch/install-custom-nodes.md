# Installing Custom Nodes

Use this when you know what node you need and are ready to install it. For finding a node first, see [comfyai/nodes/find-a-node.md](../nodes/find-a-node.md).

---

## Safety rule: always use `uv pip`, never plain `pip`

When installing from `--extra-index-url`, **do not use `pip`**. Plain pip has an unresolved vulnerability where a squatter package on PyPI can take priority over the extra index URL. UV resolves index priority correctly. This is not fixed in pip as of now.

Always:
```bash
uv pip install --extra-index-url https://nodes.appmana.com/simple/ <package-name>
```

Never:
```bash
pip install --extra-index-url https://nodes.appmana.com/simple/ <package-name>  # unsafe
```

---

## Installing from the appmana catalog

The appmana index hosts 2500+ ComfyUI node packages as wheels.

```bash
cd {installDir}
uv pip install --extra-index-url https://nodes.appmana.com/simple/ <package-name>
```

**CUDA variants** — the default index (`/simple/`) serves CUDA 13.0. For CUDA 12.8 builds:
```bash
uv pip install --extra-index-url https://nodes.appmana.com/simple/cu128 sageattention
uv pip install --extra-index-url https://nodes.appmana.com/simple/cu128 comfyui-nunchaku
```

Only packages with compiled CUDA kernels (e.g. `sageattention`, `comfyui-nunchaku`) differ between variants. All other packages are identical across CUDA versions.

**Install all packages a workflow requires:**
```bash
cd {installDir}
uv pip install --extra-index-url https://nodes.appmana.com/simple/ \
  -r <(comfyui workflows requirements path/to/workflow.json)
```

---

## Installing from git (community nodes not in the catalog)

```bash
cd {installDir}
git clone --depth 1 https://github.com/author/ComfyUI-SomeNodes.git custom_nodes/ComfyUI-SomeNodes
uv pip install -r custom_nodes/ComfyUI-SomeNodes/requirements.txt
```

Some nodes have no `requirements.txt` — skip the install step in that case.

---

## After installing

The ComfyUI server must be restarted before new nodes appear. Tell the user to use the **Start ComfyUI** command in the VS Code extension (or restart if already running).

---

When installation is done, return to where you came from — either [comfyai/nodes/find-a-node.md](../nodes/find-a-node.md) or the task that sent you here.
