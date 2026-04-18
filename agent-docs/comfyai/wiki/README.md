# Agent Wiki

Your workspace for notes, learnings, and proposed knowledge contributions.

---

## What this is

`wiki/` is **your space** — it persists across extension updates and is never wiped.

`knowledge/` (sibling directory) is extension-provided — it is wiped on every reinstall. See `knowledge/README.md` for details.

---

## Why use this

The knowledge base (`knowledge/`) is fixed. Your notes (`wiki/`) grow with each session.

**The wiki is your external memory.** Write things down, summarize them, then you can forget them and pick it back up later. Don't try to hold everything in context — offload it here.

**The wiki evolves with you.** This is a solid starting structure. Add, remove, and reshape files as you learn what works. The extension doesn't manage your wiki — you do.

**At the start of every session:**

1. Read `wiki/index.md` — the dashboard (active goal, open tasks, last session cliffhanger)
2. Scan `wiki/sessions/` for the most recent session log
3. Check `wiki/memory.md` only if you need deeper background

**During the session:**

- Write session notes to `wiki/sessions/YYYY-MM-DD.md` — log as you go
- Use `wiki/scratch/` for temporary working notes
- Add patterns to `wiki/patterns/` (successful node combos or prompts)
- Move upstream proposals to `wiki/contributions/`

**Before ending the session:**

- Update `wiki/index.md` if the active goal, open tasks, or gotchas changed (keep it short — one screen)
- Finish your `wiki/sessions/YYYY-MM-DD.md` entry
- Promote anything stable to `wiki/memory.md` (only once proven across multiple sessions)
- Clean up `wiki/scratch/`

---

## Where notes go

Use `wiki/scratch/` as a staging area. When you have something worth keeping, route it:

| Content | Destination |
|---|---|
| Per-session events, learnings, errors, progress | `wiki/sessions/YYYY-MM-DD.md` |
| Dashboard update — goal changed, new gotcha | `wiki/index.md` (overwrite; keep to one screen) |
| Stable cross-session knowledge (proven over time) | `wiki/memory.md` |
| Successful node combinations or prompts | `wiki/patterns/` |
| Proposed upstream improvements | `wiki/contributions/` |
| User preferences (machine-readable) | `wiki/state/user-preferences.json` |

---

## What you can write to

| File/Directory | Write to this |
|---|---|
| `wiki/` | Notes, contributions, session logs |

**Patches and triggers are in comfyai/ root (not wiki/):**

- `apply-trigger.json` — patch apply, queue, restart, etc.
- Named patch files — workflow changes (any filename)

**Read-only files — do not write to these:**

```
workflow-summary.md          ← extension updates on every graph change
workflow-state.readonly.json ← extension updates on every graph change
apply-response.json          ← extension writes this
server-info.json            ← extension writes on panel open
available-models.json       ← extension writes on catalog refresh
nodes/                     ← extension-generated, overwritten on refresh
```

---

## Directory layout

```
wiki/
  README.md              ← you are here
  index.md               ← dashboard: active goal, tasks, gotchas, last session (one screen — overwrite each session)
  memory.md              ← distilled cross-session knowledge (graduate from sessions/ when proven stable)
  quick-ref.md           ← workflow selection decision tree + session checklist
  sessions/              ← per-session logs (one file per session, named YYYY-MM-DD.md)
    template.md          ← copy this to start a new session log
  patterns/              ← successful node combinations and prompts
    index.md             ← pattern index
    lighting-portraits.md
    quick-to-quality.md
    image-to-image-flows.md
  state/                 ← structured JSON state (machine-readable)
    user-preferences.json ← explicit user preferences
  contributions/          ← proposed additions to the knowledge base
  scratch/               ← temporary working notes + templates
```

---

## How to use this wiki

### `index.md` — dashboard (sticky note, not notebook)

One screen max. Overwrite it at session start/end — do not append to it.

**Write here:** active goal, open tasks, critical gotchas, last session cliffhanger.
**Don't write:** learnings, session events, stable knowledge — those go in `sessions/` or `memory.md`.

### `memory.md` — distilled cross-session knowledge

Things that have **proven true across multiple sessions**.

**Write here:** stable user observations, environment facts, node behaviour confirmed across setups.
**Don't write:** per-session events or anything still being figured out — put those in `sessions/` first, graduate to here only once stable.

### `sessions/` — per-session log

One file per session: `sessions/YYYY-MM-DD.md`. Copy `sessions/template.md` to start.

**Write here:** what happened, what you learned, errors and fixes, what you left off at.
**This is where most wiki writing goes — not `index.md`.**

### `scratch/` — temporary notes + templates

Use while working on a task. Route useful things to `sessions/` or `contributions/` when done.

**Templates:**

- `sessions/template.md` — session log template
- `scratch/template-finding.md` — structured finding format

### `quick-ref.md` — workflow selection decision tree

Single file for common decisions. Read this first, then `index.md` for current context.

### `contributions/` — propose upstream improvements

If you discover something worth sharing with other users:

```markdown
<!-- contribution
  target: knowledge/models/flux.md
  type: edit
  description: Add notes on loading Flux from CivitAI with auth token
  confidence: high
  tested: yes
  source: tested on local setup, user confirmed behavior
-->
## Flux CivitAI Loading

When downloading Flux models from CivitAI...
```

**Contribution types:** `new-file` | `edit`

**Confidence:** `high` | `medium` | `low` | **be honest**

**Tested:** `yes` | `partial` | `no`

---

## What makes a good contribution

- Analyzed across multiple workflows, not just one
- Tested or at least stated honestly about confidence
- Actionable — not just "X exists" but "how to use X"
- Not already covered in `knowledge/`
- One topic per file

**Example:** Analyze 5 workflows to understand how `NodeXYZ` is used across them, then write a contribution documenting the pattern. That's worth submitting.

---

## GitHub submission

The agent **cannot run VS Code commands directly**. To propose a contribution:

1. Write your contribution to `wiki/contributions/` with the contribution header
2. Tell the user: "I found something worth sharing with others who use this comfyai extension. Run **ComfyUI: Submit Knowledge Contributions** to propose it."
3. The user runs the command from the VS Code command palette

The extension provides these commands:

| Command | What it does |
|---|---|
| **ComfyUI: List Pending Contributions** | Show all contributions in wiki/contributions/ |
| **ComfyUI: Submit Knowledge Contributions** | Open contributions for review, submit to GitHub |
| **ComfyUI: View Contribution Diff** | Preview a contribution against its target file |
| **ComfyUI: Mark Contribution Merged** | Archive a merged contribution |
| **ComfyUI: Discard Contribution** | Delete a rejected contribution |

---

## File naming

- Use kebab-case: `flux-civitai-loading.md`
- Be specific: one topic per file
- If a file grows too large, split it

---

## Wiki Mode (automated reminders) — recommended

The extension supports an optional **wiki-mode** that injects a `wiki_reminder` field into every `apply-response.json`.

**This mode is strongly recommended.** The wiki is your only persistent memory across sessions — without regular recording, context and insights are lost between conversations. Wiki mode gives you a nudge after every action so you never have to remember to update it manually. Enable it at the start of every session.

### Enabling wiki mode

**User (VS Code Settings):** Toggle **ComfyUI › Wiki Mode** to `true`. Takes effect immediately — no trigger file needed.

**Agent (apply-trigger.json):**

```json
{"command": "wiki-mode", "enabled": true, "ts": 1}
```

Disable:

```json
{"command": "wiki-mode", "enabled": false, "ts": 2}
```

> **Priority:** If you enable wiki mode via trigger, the setting is ignored while you hold control. If you disable via trigger, control falls back to the setting — so if the user has it on, it stays on. If you want it fully off, ask the user to disable the setting too.

### What you'll see in apply-response.json

```json
{
  "status": "ok",
  "message": "Patch applied: 1 node(s), 0 link(s)",
  "wiki_reminder": "Record anything useful in wiki/sessions/YYYY-MM-DD.md (per-session log — this is where most writing goes). Update wiki/index.md only if the active goal, open tasks, or gotchas changed ..."
}
```

### What to do when you see wiki_reminder

This is a prompt, not a hard stop. Use judgement:

**Do record:**

- What you did, what happened, and what you learned this session → `wiki/sessions/YYYY-MM-DD.md`
- Surprising node behaviour, undocumented quirks, errors and their fixes → session log
- Open questions or things to investigate next session → session log

**Where to write:**

| Content type | File |
|---|---|
| Per-session events, learnings, errors, progress | `wiki/sessions/YYYY-MM-DD.md` ← **write here first** |
| Dashboard update (goal changed, new gotcha) | `wiki/index.md` (overwrite; one screen max) |
| Stable cross-session knowledge (proven over time) | `wiki/memory.md` |
| Successful node combinations, prompts | `wiki/patterns/` |
| Explicit user preferences (machine-readable) | `wiki/state/user-preferences.json` |
| Proposed upstream improvements | `wiki/contributions/` |

**Skip if:** the response was trivial status-only with nothing new to learn.

Keep entries short. Summarize, don't transcribe.
