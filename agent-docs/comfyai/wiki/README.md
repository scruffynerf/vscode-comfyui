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
1. Read `wiki/index.md` to get context from previous sessions
2. Check `wiki/sessions/` for session-specific notes

**During the session:**
- Write findings to `wiki/scratch/` temporarily
- Move important things to `wiki/index.md` (general learnings)
- Move contributions to `wiki/contributions/` (things worth sharing)

**Before ending the session:**
- Clean up `wiki/scratch/`
- Update `wiki/index.md` with what you learned
- Note open questions for the next session

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
  index.md               ← your running notebook (read quick-ref.md first)
  quick-ref.md           ← workflow selection decision tree + session checklist
  patterns/              ← common successful node combinations
    index.md             ← pattern index
    lighting-portraits.md
    quick-to-quality.md
    image-to-image-flows.md
  state/                 ← structured JSON state (machine-readable)
    user-preferences.json ← explicit user preferences
  contributions/          ← proposed additions to the knowledge base
  sessions/              ← per-session notes
  scratch/               ← temporary scratch space + templates
```

---

## How to use this wiki

### `index.md` — your running notebook

Write things that **no other file tells you**:
- User's preferences and favorites
- Cross-workflow observations (how a node behaves across different setups)
- Active goals and context across sessions
- Open questions you're still solving

**Don't write:** installed models, workflow contents, server config — read those from the dynamic files instead.

### `scratch/` — temporary notes + templates

Use while working on a task. Move useful things to `index.md` or `contributions/` when done.

**Templates:**
- `template-session-log.md` — auto-fill date/time for session notes
- `template-finding.md` — structured finding format

### `quick-ref.md` — workflow selection decision tree

Single file for common decisions. Read this first, then `index.md` for context.

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
2. Tell the user: "I found something worth adding. Run **ComfyUI: Submit Knowledge Contributions** to propose it."
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
