# Writing Agent Documentation

This guide governs how documentation in this project is written — both for the `agent-docs/` files that get deployed into user workspaces and for any supporting material like this file. Read it before writing any new docs.

The intended reader of this guide is an AI agent (or a developer) who needs to add or update documentation. The principles below exist because we've learned that naive documentation creates bad agent behavior — context overload, rabbit holes, wrong-path commitment. Every rule here is load-bearing.

---

## The deployment model

Files in `agent-docs/comfyai/` are source files. Their directory structure **mirrors** the deployed `comfyai/` directory in user workspaces. On extension activation, `agent-docs/comfyai/` is copied recursively into the workspace `comfyai/` directory.

**Never write agent documentation directly into `comfyai/` paths.** Always write in `agent-docs/comfyai/`, in the correct subdirectory. The workspace copy is ephemeral — it gets overwritten on every activation.

**To add a new doc**: place it in the correct location under `agent-docs/comfyai/` and it will be deployed automatically. No `extension.ts` changes needed. The only exception is `COMFYUI_AGENT_GUIDE.md` (goes to workspace root), which is handled separately in `ensureAgentGuide()`.

---

## The knowledge/ vs wiki/ distinction

`knowledge/` and `wiki/` serve different purposes:

| Directory | Purpose | Who writes it | Survives reinstall? |
|---|---|---|---|
| `knowledge/` | Extension-provided patterns and reference | Extension developers | No — wiped on update |
| `wiki/` | Agent workspace, personal notes, contributions | Agent (and user) | Yes — seeded once, never overwritten |

**When documenting something for all users**: write it in `agent-docs/comfyai/knowledge/` and it will be deployed.

**When the agent discovers something worth sharing**: write it to `wiki/contributions/` with a contribution header, then run `ComfyUI: Submit Knowledge Contributions` to propose it upstream.

**When the agent is taking notes for themselves**: write to `wiki/index.md`, `wiki/sessions/`, or `wiki/scratch/`.

---

## Principle 1: Gates, not orientations

A `README.md` in any subdirectory has one job: **route the agent correctly, including routing them back out.**

A gate document asks: "Should you even be here?" before it explains anything. It confirms the agent has the right task, checks for shortcuts they may have missed, and only then routes forward to a specific sub-document. The worst outcome is an agent committing to a path they don't need.

A good gate:
- Lists the reasons an agent might have landed here
- Asks verification questions ("Have you checked whether X already exists?")
- Routes away when appropriate ("If the user wants to see this in their panel, stop — go back to `comfyai/README.md`")
- Routes to *one specific file* per task type, not to a directory

A bad gate is an orientation document that assumes you're in the right place and immediately explains how things work.

---

## Principle 2: Task-oriented, not capability-oriented

Name files for what an agent needs to *do*, not for what the system *can* do.

| Bad (capability) | Good (task) |
|------------------|-------------|
| `embedded-api.md` | `run-workflow.md` |
| `workflow-system.md` | `find-a-node.md` |
| `node-authoring.md` | `tdd-loop.md` |

An agent with a task in hand should be able to look at a file listing and immediately know which file is theirs, without reading any of them first.

---

## Principle 3: Narrow files beat comprehensive files

Split a file when:
- Reading it requires the agent to skip sections irrelevant to their task
- A section would pull in substantial new context not needed for adjacent sections
- Two different task types would both arrive at the same file

Do not split a file when:
- The sections are naturally sequential (you need A before B)
- The total file is short enough to read without skimming

There is no minimum file size. A 20-line stub is a valid document.

---

## Principle 4: Read vs. look-up distinction

Every file is either meant to be **read entirely** or **looked up in**.

- **Read files**: Gates, task docs. An agent reads the whole thing before acting. Keep these short — under ~100 lines is ideal.
- **Look-up files**: Reference docs, catalogs, schemas. An agent scans for a specific heading. These can be long but must have clear, scannable headers. Always say explicitly in the file: "This is a reference — look up what you need, do not read the whole file."

Reference files belong in a `reference/` subdirectory. An agent should never arrive at a reference file directly — they should come from a task doc that says "for X, see `reference/python-api.md` under `Configuration options`."

---

## Principle 5: Stubs signal intent

A stub is a file with a clear heading, a one-sentence description of what it will contain, and a `<!-- TODO: ... -->` marker. It is preferable to a missing file.

Why: If a file is missing, an agent may spend tokens searching for information that doesn't exist yet, or may attempt to proceed without it. A stub that says "this information is not yet documented — stop and inform the user" prevents that failure mode.

Every stub must include:
1. What the document will cover (so an agent can confirm they're in the right place)
2. A `<!-- TODO: ... -->` with a clear description of what needs to be written
3. An explicit instruction: "This document is incomplete. Do not attempt to proceed — inform the user that [X] is not yet documented."

---

## Principle 6: No rabbit holes

Every file that routes forward must also state the exit condition — what the agent does when they're done reading.

Every file that is a dead end (a reference doc, a stub) must say so explicitly: "When you have what you need, return to [file] and continue."

An agent should never finish reading a file and not know what to do next.

---

## Principle 7: Verify before routing forward

Gate documents must prompt the agent to verify their assumption before proceeding. Agents often land in the wrong place because they pattern-matched the routing rule without fully understanding the user's request.

Common verification questions for gates:
- "What exactly did the user ask for? Quote it."
- "Does the user expect to see the result in their ComfyUI panel?"
- "Have you checked whether this already exists?" (with specific places to check)
- "Is the answer to their question in a simpler place first?"

The point is not to be pedantic — it's to catch the agent before they spend 2000 tokens going the wrong direction.

---

## File structure summary

`agent-docs/comfyai/` mirrors `comfyai/` exactly. The tree is the map:

```
agent-docs/comfyai/                         deployed to → workspace comfyai/
  README.md
  wiki/                                     ← AGENT WORKSPACE (seeded, preserved)
    README.md                               ← agent orientation + conventions
    index.md                                ← agent's running notebook
    contributions/                          ← proposed upstream contributions (created by agent)
  knowledge/                                ← EXTENSION PROVIDED (wiped on reinstall)
    README.md
    index.md                                ← router: find what you need
    techniques/                             ← how to do specific things
    guidance/                               ← settings and inputs
    workflow/                               ← structure and patterns
    reference/                              ← lookup docs (not read front-to-back)
    hardware/                               ← hardware-specific guidance
    models/                                 ← model-specific patterns
    hiddenswitch/                           ← hiddenswitch Python library mode
      README.md                             ← gate
      run-workflow.md
      graphbuilder.md
      node-development/
        README.md                           ← gate
        authoring.md
        tdd-loop.md
        testing.md
      reference/
        python-api.md                       ← look-up only
        models.md                           ← look-up only
  nodes/
    README.md
    find-a-node.md
  workflow-history/
    README.md
```

Non-comfyai files deployed separately:
- `COMFYUI_AGENT_GUIDE.md` → workspace root

When adding a new doc: place it in the right location under `agent-docs/comfyai/`. That's it.

---

## What not to document here

- Code patterns, architecture, or implementation details that are readable from the source → read the source
- Information that changes frequently and will go stale → link to the authoritative source
- Everything an agent might possibly need → document the 80% case; stub the rest with honest TODOs
