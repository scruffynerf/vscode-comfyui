# Finding a Node That Does What You Need

Use this before writing any custom code. The right node may already exist.

Work through these steps in order. Stop as soon as you find what you need.

---

## Step 1 — Check already-installed nodes

The user may already have a node installed that does this.

Start with the human-readable catalog:
- [comfyai/nodes/README.md](README.md) — entry point: lists the ten node classes with links to each class file
- `comfyai/nodes/classes/<class>.md` — nodes grouped by class (source, sampler, etc.) — generated at runtime

If the category files don't answer the question, search the raw registry by keyword:
```bash
# Find nodes whose description matches a keyword
cat comfyai/nodes/node-registry.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
term = 'upscale'   # change this
for k, v in data.items():
    desc = str(v.get('description', '') + str(v.get('display_name', ''))).lower()
    if term in desc:
        print(k, '-', v.get('display_name', ''))
"
```

If you find a matching node: use it via the GUI bridge ([comfyai/README.md](../README.md)). You're done here.

---

## Step 2 — Check pip-installable nodes (nodes.appmana.com)

The hiddenswitch comfyui ecosystem maintains a catalog of 2500+ nodes installable as wheels.

**Start with the capability index** — packs organised by what they can do:
[comfyai/nodes/capability/index.md](capability/index.md) → pick the matching task area → read the linked detail file.
Each entry shows which specific node names matched, so you can confirm fit before installing.

**Check what a workflow needs** (if you have the workflow file):
```bash
{installDir}/{venv}/bin/comfyui workflows requirements path/to/workflow.json
```

If you find what's needed: install it using [comfyai/hiddenswitch/install-custom-nodes.md](../hiddenswitch/install-custom-nodes.md), then tell the user to restart the ComfyUI server. The extension refreshes the node catalog automatically once the server is back up. You're done here.

---

## Step 3 — Search the broader ComfyUI ecosystem

Work through these in order. Stop as soon as you find a match.

### 3A — Search the full Comfy Registry by keyword

[comfyai/nodes/registry-search.json](registry-search.json) contains ~2600 active packs (id, name, description, repo url).

```python
import json
with open("comfyai/nodes/registry-search.json") as f:
    packs = json.load(f)
term = "upscale"   # change this — matched against id + name + description
for p in packs:
    if term.lower() in (p["id"] + p["name"] + p["desc"]).lower():
        print(p["id"], "—", p["name"])
        print("  ", p["desc"][:120])
        print("  ", p["repo"])
```

If you find a match: install it using [comfyai/hiddenswitch/install-custom-nodes.md](../hiddenswitch/install-custom-nodes.md). You're done here.

### 3B — Search by node class name

[comfyai/nodes/node-class-search.json](node-class-search.json) maps ~1700 packs to their full list of node class names.
Use this when you know (or can guess) what a node class might be called.

```python
import json
with open("comfyai/nodes/node-class-search.json") as f:
    index = json.load(f)
term = "CLIPText"   # change this — partial match against class names, case-insensitive
for pack_id, name, repo, classes in index:
    hits = [c for c in classes if term.lower() in c.lower()]
    if hits:
        print(pack_id, "—", name)
        print("  ", ", ".join(hits[:8]))
```

If you find a match: install it using [comfyai/hiddenswitch/install-custom-nodes.md](../hiddenswitch/install-custom-nodes.md). You're done here.

### 3C — Browser search (next to last resort)

If the local indexes returned nothing, ask the user to search [Comfy Registry](https://comfyregistry.org) directly — it covers the full 4000+ pack catalog and is updated more frequently than the local index.

If you find what's needed: install it, then tell the user to restart the ComfyUI server. The extension refreshes the node catalog automatically. You're done here.

---

## Step 4 — Write or modify a node (last resort)

Before committing to writing from scratch: check whether any node from steps 1–3 is *close* to what's needed. A node that does 80% of the job is a better starting point than a blank file — fork its source and modify rather than building from zero.

If nothing works as-is, proceed to:
[comfyai/hiddenswitch/node-development/README.md](../hiddenswitch/node-development/README.md)

Take note of any close match you found — the gate there will ask, and a fork is faster than scratch.
