# ComfyAI Node Catalog

Use this directory to find and understand available nodes. Read this before opening any other file here.

---

## How to use this directory

**Step 1 — Read [classes/index.md](classes/index.md).** Lists all ten functional operation classes with node counts and links to each class file. Small enough to always include in context.

**Step 2 — Read the one class file you need** (`classes/source.md`, `classes/sampler.md`, `classes/variable.md`, etc.). Each entry shows: node type, one-line purpose, key inputs → key outputs. Read the class relevant to your current decision — not all of them.

**Step 3 — Query `node-registry.json` by key for full schema.** Do not read the whole file — it is typically ~1.8 MB / ~450k tokens and will exhaust your context. Access a specific node by its type name key only.

---

## Operation classes (quick reference)

| Class | What it does | Examples |
|---|---|---|
| **Source** | No main-type inputs → produces pipeline-typed outputs | CheckpointLoaderSimple, LoadImage, LoadAudio |
| **Transform** | Same main types in and out | LoraLoader, CLIPSetLastLayer, LatentNoise |
| **Convert** | Main type A in → different main type B out | VAEEncode, CLIPTextEncode, VAEDecode |
| **Combine** | Multiple same-type inputs → single output | ConditioningConcat, ImageBatch |
| **Split** | Single input → multiple same-type outputs | LatentFromBatch |
| **Sampler** | MODEL + CONDITIONING + LATENT → LATENT | KSampler, SamplerCustomAdvanced |
| **Sink** | Main-type inputs → no connected outputs | SaveImage, SaveVideo, PreviewImage |
| **Control** | Flow control: loops, conditionals | ForLoopStart/End, WhileLoop |
| **Variable** | Outputs only primitive/non-pipeline types (INT, FLOAT, STRING, BOOLEAN, COMBO, etc.), or is SetNode/GetNode | PrimitiveFloat, KSamplerSelect, ManualSigmas, SetNode, GetNode |
| **Misc** | Doesn't fit cleanly — query the node by ID to investigate | Unusual custom nodes, multi-purpose nodes |

**Variable vs Source** — both have no main-type inputs, but they differ in what they produce:
- `Source` → pipeline data (IMAGE, MODEL, LATENT…) that flows through the generation chain
- `Variable` → parameters and configuration (INT, FLOAT, STRING…) that tune how the chain runs

`Variable` nodes won't appear in the traced main pipeline. If you see one in the summary, it's providing a configuration value to something in the pipeline.

**Misc is the "go look" signal** — the analyzer couldn't categorize that node cleanly. Common causes: custom types like `JSON_STRING` or `*`, nodes that mix pipeline and parameter outputs, or novel multi-purpose nodes.

When you encounter a `Misc` node, investigate in this order — stop as soon as you understand it:

1. **Query the node by ID** in the workflow JSON (do not read the whole file):
   ```bash
   python3 -c "
   import json
   wf = json.load(open('comfyai/workflow-state.readonly.json'))
   node = next(n for n in wf['nodes'] if n['id'] == 123)   # replace 123
   print(json.dumps(node, indent=2))
   "
   ```
   This shows its inputs, outputs, and widget values. The type name and connected types often clarify the role.

2. **Query the node registry** for its schema — `registry['NodeTypeName']` in `node-registry.json` — to see what types it formally declares.

3. **If still unclear**, look at the node's source code or ask the user what it does before assuming.

**SetNode/GetNode are always Variable** — even when they carry a `MODEL` or `LATENT`. Their role is variable storage and retrieval, not pipeline participation.

**Main pipeline types** (these determine Source/Transform/Convert/etc.):
`MODEL`, `VAE`, `CLIP`, `CLIP_VISION`, `CLIP_VISION_OUTPUT`, `CONDITIONING`, `LATENT`, `IMAGE`, `MASK`, `VIDEO`, `AUDIO`, `CONTROL_NET`, `STYLE_MODEL`, `GLIGEN`, `UPSCALE_MODEL`, `SAMPLER`, `SIGMAS`, `NOISE`, `GUIDER`

**Primitive types** (nodes that only deal in these are Variable-class, not pipeline participants):
`STRING`, `INT`, `FLOAT`, `BOOLEAN`, `COMBO`

---

## Querying node-registry.json

**Python:**
```python
import json
registry = json.load(open('comfyai/nodes/node-registry.json'))
node_info = registry['KSampler']   # fetch one node by type name
```

**Shell (jq):**
```bash
jq '.KSampler' comfyai/nodes/node-registry.json
```

**Keyword search:**
```bash
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

**What you get back:** the full node definition — all required/optional inputs with types and defaults, all outputs with types, and the `output_node` flag.

---

## If the catalog is missing or stale

Run `ComfyUI: Refresh Node Catalog` from the command palette. The catalog also updates automatically when the panel opens if the server is running.

---

## If you need a node that isn't installed

See [find-a-node.md](find-a-node.md). It covers the full discovery hierarchy: installed nodes → pip packages → community → writing a new one.
