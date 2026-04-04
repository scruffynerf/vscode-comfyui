# ComfyAI Agent Protocol

This directory is your interface to the user's ComfyUI workflow. Read this before doing anything.

---

## Which mode should you use?

Before touching any file here, answer these questions in order:

**Does the user want to see this change in their ComfyUI panel?**
→ Yes: use the **GUI bridge** — write a patch and trigger it. See `patch-reference.md` for the full protocol.

**Does the user want to run/queue the workflow that's already in the panel?**
→ Yes: write `{"command": "queue", "ts": <n>}` to `apply-patch-trigger.json`. Do NOT use hiddenswitch for this.

**Does this involve getting a result silently, testing code, or building/validating a custom node — with no GUI involvement at all?**
→ Yes: use **hiddenswitch Python** — ComfyUI as a library, no GUI, no server needed. See `hiddenswitch/README.md`.

**Is a ComfyUI server already running (panel is open, you can see the UI)?**
→ Use the **GUI bridge** (triggers above) or the **server HTTP API** (`http://localhost:8188/...`). Do NOT start a hiddenswitch embedded Python client alongside a running server.

When in doubt, ask the user which they prefer before proceeding.

---

## Files in this directory

| File | Purpose |
|---|---|
| `workflow-summary.md` | **Read this first.** Current workflow: nodes, links, model, prompts, sampler settings, node IDs. |
| `workflow-state.readonly.json` | Full workflow graph JSON. READ ONLY — use the patch pattern to make changes. |
| `workflow-patch.json` | Write your partial changes here (nodes/links to add, update, or remove). |
| `apply-patch-trigger.json` | Write a trigger here to apply your patch or run a command. |
| `apply-response.json` | **Read after every trigger write.** Confirms success or gives an error. Written by the extension. |
| `available-models.json` | Model names the server knows: checkpoints, VAEs, LoRAs, ControlNets, etc. |
| `server-info.json` | Server config: device (MPS/CUDA/CPU), VRAM, Python/torch versions. Written on panel open. |
| `patch-reference.md` | **Full patch protocol** — trigger format, commands, widget arrays, slot indices, node type replacement. |
| `nodes/` | Node catalog. Start with `nodes/README.md` when you need to find or look up a node. |
| `workflow-history/` | Past patch snapshots. Enter only for revert operations — see `workflow-history/README.md`. |
| `hiddenswitch/` | Running ComfyUI as a Python library (silent execution, node dev/testing). |
| `knowledge/` | Pattern knowledge: model settings, hardware guidance, workflow conventions. See `knowledge/index.md`. |

---

## Reading state efficiently

1. Read `workflow-summary.md` first — it has node IDs for common tasks, so you rarely need the full graph.
2. If you need a specific node's full detail, read `workflow-state.readonly.json` and look up by `id`.
3. After a patch, both files update automatically once the change is reflected in the panel.
4. **Do not use a cached `workflow-summary.md` from earlier in your context** — it goes stale as soon as any patch is applied.

---

## Model names

Check `available-models.json` for valid model names. If the file doesn't exist, query `GET http://localhost:8188/object_info/CheckpointLoaderSimple` (look at `inputs.required.ckpt_name[0]`) or ask the user.

---

## Node catalog

See `nodes/README.md`. Short version: read `nodes/classes/index.md` to find your operation class, then read only that class file. Query `nodes/node-registry.json` by key for full schema — don't read the whole file.

---

## Something went wrong?

**See `troubleshooting.md`** — covers: patch didn't appear, queue did nothing, generation failed silently, model not found, slow generation, server log location and what to look for.
