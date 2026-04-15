# ComfyAI Agent Wiki System — Design

## Overview

The agent needs a persistent, growing workspace separate from extension-provided knowledge. This allows:
1. Agent to learn and remember things across sessions
2. Agent to contribute upstream improvements to the knowledge base
3. Extension updates to not wipe agent's work

## Directory Structure

```
comfyai/
  knowledge/              # EXTENSION-PROVIDED. Do not edit.
  wiki/                   # AGENT WORKSPACE. Extension never touches this.
    README.md             # Agent orientation + conventions
    index.md              # Agent's running notes — what they've learned
    contributions/        # Proposed upstream contributions
      *.md                # Each file = one contribution
    sessions/             # Per-session or per-project notes
      *.md
    scratch/             # Temporary scratch space
      *.md
```

## File: wiki/README.md (Agent Orientation)

**What the agent can read:**
- `knowledge/` — extension-provided knowledge base (read only)
- `wiki/` — agent's own workspace (read and write)

**What the agent can write:**
- `wiki/index.md` — master notes, what the agent has learned
- `wiki/sessions/` — session-specific observations
- `wiki/scratch/` — temporary notes during a task
- `wiki/contributions/` — proposed additions to the knowledge base

**What the agent should NOT write:**
- Any file in `knowledge/` — these are wiped on extension reinstall
- Any file in `_extension/` — extension-generated only

## Contribution File Format

Every file in `wiki/contributions/` follows this format:

```markdown
<!-- contribution
  target: knowledge/models/flux.md
  type: addition  (new-file | edit | new-knowledge-file)
  description: Add notes on loading Flux from CivitAI with auth token
  confidence: high  (high | medium | low)
  tested: yes  (yes | partial | no)
  source: tested on local setup, user confirmed behavior
  author: agent  (agent | user | external)
-->
## Flux CivitAI Loading

When downloading Flux models from CivitAI that require authentication...

[full proposed content]
```

**Field definitions:**
- `target` — path relative to `comfyai/`, e.g. `knowledge/models/flux.md` or `knowledge/models/civitai.md` (new file)
- `type`:
  - `new-file` — proposes a new knowledge file (also set `target` to the new filename)
  - `edit` — proposes changes to an existing file
  - `new-knowledge-file` — same as `new-file` but signals it belongs in `knowledge/` (vs `wiki/`)
- `confidence` — how sure the agent is this is correct
- `tested` — has the agent verified this works
- `source` — where the information came from
- `author` — who wrote the contribution

## Contribution Lifecycle

```
1. Agent discovers something worth documenting
        ↓
2. Writes to wiki/scratch/ or wiki/index.md (temp)
        ↓
3. If contribution is worth sharing upstream:
   - Move to wiki/contributions/<topic>-<detail>.md
   - Fill in contribution header
        ↓
4. User runs "Submit Contributions" command
        ↓
5. Extension builds GitHub PR/issue from contributions/
        ↓
6. User reviews in browser, submits
        ↓
7. (Optional) Maintainer merges, contributer marks contribution as merged
```

## GitHub Submission

**Two modes:**

### Mode 1: Submit as Pull Request
For knowledge additions that are ready to merge. Creates a PR against `vscode-comfyui`.

```
gh pr create \
  --title "knowledge: add Flux CivitAI loading notes" \
  --body "$(cat contribution-file.md)" \
  --base main
```

Requires `gh` CLI and authenticated session.

### Mode 2: Submit as GitHub Issue
For knowledge gaps, open questions, or uncertain findings. Creates an issue.

```
gh issue create \
  --title "[knowledge] Flux CivitAI loading documentation" \
  --body "$(cat contribution-file.md)"
```

User chooses mode per-contribution or batch.

## Extension Commands

| Command | What it does |
|---|---|
| `ComfyUI: Submit Knowledge Contributions` | Opens contribution review panel |
| `ComfyUI: List Pending Contributions` | Lists all `wiki/contributions/` files |
| `ComfyUI: View Contribution` | Opens a specific contribution for review |
| `ComfyUI: Mark Contribution Merged` | Archives a merged contribution |
| `ComfyUI: Discard Contribution` | Deletes a low-quality contribution |

## Contribution Review Panel (UI)

The extension provides a webview that:
1. Lists all pending contributions with metadata
2. Shows full diff against target file (for `edit` type)
3. Preview of new file (for `new-file` type)
4. Buttons: "Submit as PR", "Submit as Issue", "Edit", "Discard"

## Agent Instructions

The agent is told:

> The `knowledge/` directory is provided by the extension. It is wiped on every reinstall.
>
> Your workspace is `wiki/`. Anything you write there persists across extension updates.
>
> If you discover something useful that others should know:
> 1. Write it to `wiki/scratch/` first to organize your thoughts
> 2. If it's a solid finding, move it to `wiki/contributions/<topic>.md`
> 3. Fill in the contribution header
> 4. Tell the user: "I found something worth adding to the knowledge base. Run 'Submit Knowledge Contributions' to propose it."
>
> The `wiki/index.md` file is your running notebook — summarize what you've learned about this project here. It helps you on future sessions and gives the user insight into your understanding.

## Extension Installer Changes

The `copyDirRecursive` function in `agentFiles.ts` must:
1. Copy `knowledge/` fresh from `agent-docs/comfyai/knowledge/` on every activation
2. NEVER touch `wiki/` — it already exists and should be preserved

```
if (sourcePath === 'knowledge') {
  // Always copy fresh — it's extension-provided
  copyFresh(sourcePath, destPath);
} else {
  // Preserve existing — it's user/agent workspace
  copyIfNotExists(sourcePath, destPath);
}
```

## Wiki Index Format

`wiki/index.md` is the agent's master notebook:

```markdown
# Project Knowledge Index

## What I Know About This Project
[Agent's understanding of the user's ComfyUI setup, models, custom nodes, etc.]

## Model Notes
[User-specific notes about models they're using]

## Workflow Conventions
[What this user prefers, their typical setup, etc.]

## Open Questions
- [Things the agent is still figuring out]

## Active Contributions
- `contributions/flux-civitai.md` — submitted, awaiting merge
- `contributions/hunyuan-wiring.md` — in progress

## Recent Learnings
- 2024-04-15: Flux dev needs T5 + CLIP-L, not SDXL dual-CLIP
```

## File Naming Conventions for Contributions

```
contributions/
  flux-civitai-loading.md        # topic-focus
  flux-fp8-vram-usage.md
  sdxl-vae-fp16-fix.md
  hires-fix-two-pass.md
  controlnet-t2i-adapter.md
```

- Use kebab-case
- Be specific — `flux-civitai-loading.md` not `flux-notes.md`
- One contribution per file
- If a file grows too large, split it

## What Makes a Good Contribution

The agent should only move something to `contributions/` when:
1. It's tested (or at least the confidence is stated honestly)
2. It adds real value — not just "I learned X exists"
3. It's not already covered (check `knowledge/index.md`)
4. It's specific enough to be actionable

## Discarded Contributions

If a contribution is wrong, merged upstream, or no longer relevant:
1. Move to `wiki/.archive/<year>/` (hidden directory)
2. Or simply delete
3. The agent should NOT feel bad about discarding — quality over quantity

## Future Considerations

- Could add `wiki/todos.md` for agent-assigned tasks
- Could add `wiki/context.md` that the agent updates with session-start state
- Could add `wiki/references.md` for external links the agent found useful
- Could add versioning to contributions — see when a finding was first recorded
