### Knowledge & Reference: From Catalog to Understanding

Raw node data is not knowledge. The ComfyUI server can tell an agent every node's inputs, outputs, and defaults via `/object_info` — but that alone produces rote, naive workflows. Real knowledge is knowing *when* to use a node, *why* it exists, and what the idiomatic patterns are.

**The zero-out conditioning example illustrates the gap perfectly.** A KSampler requires both a positive and negative conditioning input. An agent with only raw node data will dutifully wire up a full `CLIPTextEncode` for the negative side, choose a prompt, and connect it. An agent with knowledge knows: in the vast majority of modern workflows, a `ConditioningZeroOut` node connected to the positive conditioning output is all you need for the negative side — no text encoder, no prompt decision, no extra wiring. Nothing in the node's inputs/outputs tells you this. It's a pattern, and patterns live in knowledge, not schemas.

**The knowledge layer is tiered, not flat.** Dumping every node's full specification into context is the wrong move — it overwhelms both the agent and the token budget. Instead, the catalog is structured as three tiers, each retrieved only when needed:

**Tier 1 — Operation Class Index** (`comfyai/nodes/index.md`)
One small file. Ten operation classes, what they mean, and which file to read next. Small enough to include in any context. If a task requires something that appears in no class, that's an immediate signal it's a custom node needing research.

**Tier 2 — Per-Class Node Lists** (`comfyai/nodes/<class>.md`)
One file per operation class. Each entry: node type name, one-line purpose, key input types → key output types. Enough to make a selection decision. Points to the raw JSON for full schema detail, and eventually to pattern knowledge entries. An agent reads only the class file relevant to its current decision.

**Tier 3 — Raw Catalog + Knowledge** (`comfyai/nodes/node-registry.json` + future `comfyai/nodes/knowledge/`)
The raw `/object_info` dump for full schema lookups — agents query a specific key, they don't read the whole file. The knowledge layer lives alongside it: per-node or per-pattern markdown files in `comfyai/nodes/knowledge/`, hand-authored or curated, covering *when* to use a node, *why* it exists, common combinations, and what to use instead in typical cases. This layer is intentionally separate from the auto-generated catalog because it cannot be derived from code alone.

**Functional classification by type signature, not the category field.** The `category` metadata in `/object_info` is unreliable — it conflates menu organization with node function, varies wildly across custom packs, and is inconsistently applied. Instead, operation class is inferred from what a node actually does to its types. Nodes are typed functions; the type signature is the truth.

The ten operation classes and their inference rules:

| Class | Signature pattern | Examples |
|-------|------------------|---------|
| **Source** | no main-type inputs → typed outputs | CheckpointLoader, LoadImage, RandomNoise |
| **Transform** | T inputs → same T outputs | LoRALoader (MODEL+CLIP→MODEL+CLIP), ImageSharpen |
| **Convert** | T inputs → different U outputs | VAEEncode (IMAGE→LATENT), CLIPTextEncode (STRING→CONDITIONING) |
| **Combine** | multiple T inputs → single T output | ConditioningConcat, ImageBatch, string concat |
| **Split** | single T input → multiple T outputs | ImageSplit, demux nodes |
| **Sampler** | MODEL+CONDITIONING+LATENT → LATENT | KSampler, KSamplerAdvanced, SamplerCustomAdvanced |
| **Sink** | `output_node: true` or no outputs at all | SaveImage, SaveVideo, PreviewImage |
| **Control** | loop/flow naming patterns | ForLoopStart, ForLoopEnd, WhileLoopOpen |
| **Variable** | outputs only primitive types (INT/FLOAT/STRING/etc.) or is SetNode/GetNode | PrimitiveFloat, ComfyMathExpression, SetNode, GetNode |
| **Misc** | type signature cannot be automatically classified | nodes with unusual custom types (JSON_STRING, `*`), multi-purpose nodes |

LoRA loaders land in **Transform** (MODEL+CLIP in, MODEL+CLIP out — they modify, not load from nothing). `RandomNoise` lands in **Source** (no main-type inputs, outputs NOISE). `KSamplerSelect` lands in **Source** (outputs SAMPLER with no main-type inputs). `ManualSigmas` lands in **Source** (outputs SIGMAS). **Variable** captures parameter/configuration nodes — they wire scalar values between pipeline nodes but aren't part of the main data flow. **Misc** is the fallback for nodes whose signatures are ambiguous or use unusual custom types; inspect the workflow JSON directly for any Misc node.

Classification is evaluated in priority order: Sampler → SetNode/GetNode → Sink → Variable → Control → Source → Transform → Combine/Split → Convert → Misc.

**Incremental updates, not full rebuilds.** The catalog is expensive to generate (requires a running server) and most nodes don't change between sessions. On each trigger: fetch current node list, diff against a cached manifest, rebuild only if something changed. Matters especially with Hiddenswitch hot-reload, where new nodes can appear mid-session without a server restart. Triggers: best-effort on panel open (silent), plus an explicit `ComfyUI: Refresh Node Catalog` command.

**The retrieval model matters.** An agent satisfying a `CONDITIONING` input slot: reads index → reads `convert` and `source` category files for CONDITIONING-producing nodes → reads knowledge entry if it exists ("prefer ConditioningZeroOut unless negative conditioning is semantically important"). Lookup chain, not reading assignment.

**This is a long-term build.** The Tier 1/2 catalog ships as a concrete feature. Tier 3 knowledge entries are ongoing — they compound in value, benefit from community contribution, and are the primary vehicle for encoding patterns like the zero-out conditioning example. The VibeComfy reference code is an early prototype; porting and extending it is a medium-term goal.

---

## Knowledge entries needed (from test session 2026-04-03)

These are patterns observed in the agent test session that couldn't be derived from node schemas alone. Priority order.

### Pre-flight: settings by model family

Before queueing a workflow, an agent should check that the sampler settings are appropriate for the loaded model. Raw `/object_info` has no opinion on this. Entries needed:

| Model family | Steps | CFG | Scheduler | Notes |
|---|---|---|---|---|
| Flux Schnell | 1–4 | 1.0 | simple or euler | Distilled, CFG-free. Steps > 4 waste compute with no quality gain. CFG > 1 degrades output. |
| Flux Dev | 20–30 | 1.0 | simple or euler | Also distilled/CFG-free but higher fidelity; benefits from more steps than Schnell. |
| SDXL | 20–30 | 7.0 | dpmpp_2m + karras | Standard settings. CFG 5–9 is the useful range. |
| SD 1.5 | 20–30 | 7.0 | dpmpp_2m + karras | Old baseline. Use only when a LoRA or workflow specifically requires it. Output quality well below SDXL/Flux. |
| Chroma (diffusion-only) | — | — | — | NOT an AIO checkpoint. Requires separate CLIP + VAE. Cannot be loaded via CheckpointLoaderSimple alone. |

**Agent behavior**: if the currently loaded model is Flux and steps > 8 or CFG > 1.5, proactively flag this before queueing. Similarly flag SD1.5 as an older model if the user hasn't specifically requested it.

### Model type taxonomy (what "checkpoint" actually means)

`available-models.json` lists everything under `checkpoints` that the server knows about, but not all entries are AIO (all-in-one: model + CLIP + VAE). Types:

- **AIO / full checkpoint** — loads everything via `CheckpointLoaderSimple`. Most user-friendly.
- **Diffusion-only** (e.g. Chroma1-Base, FLUX.1 base weights) — no CLIP, no VAE. Needs companion loaders. Will error if used with `CheckpointLoaderSimple` alone.
- **Distilled** — a subtype of AIO; uses a different sampling approach (CFG-free). Flux Schnell, Flux Dev, Lightning, etc.

Before recommending a checkpoint swap, check whether the target model is AIO or requires companions. If unknown, note the uncertainty to the user. (Model type metadata is not yet in `available-models.json` — see TODO.md MODEL items.)

### Apple Silicon / MPS performance expectations

Running `--novram` on Apple Silicon (M1/M2/M3/M4) is the **recommended default**, not a fallback. All system memory is unified — there is no discrete VRAM. `--novram` tells ComfyUI to avoid pinning weights to the MPS device between operations, preventing swap pressure.

Expected generation times on M-series with `--novram`:
- Flux Schnell FP8, 4 steps: ~30–120 seconds total, depending on free unified memory
- Flux Schnell FP8, 20 steps: ~4–8 minutes (wasteful; use 4 steps instead)
- SDXL, 20 steps: ~2–4 minutes

Check `server-info.json` → `devices[0].vram_free` for current free memory. More free memory = faster. Closing other apps helps. CUDA benchmark numbers do not apply to MPS.
