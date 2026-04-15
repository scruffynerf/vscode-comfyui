# Project Knowledge Index

> This file is your running notebook. **Read `quick-ref.md` first**, then this file. Update this as you learn things no other file tells you.

---

## How to use this file well

**The wiki is your external memory.** Write things down so you can forget them and pick it back up later. Summarize, don't transcribe.

**DO write here:**
- User's preferences, favorites, and pet peeves
- Things you've learned that aren't in the knowledge base
- Cross-workflow patterns (how a specific node behaves differently in Flux vs SDXL)
- What the user is working toward (active goals)
- Open questions you're still solving
- Session context (what was happening last time)

**DON'T write here:**
- Installed models — check `available-models.json` instead
- Workflow contents — check `workflow-summary.md` instead
- Server config — check `server-info.json` instead
- Things already documented in `knowledge/` — read there instead
- Explicit user preferences — write to `state/user-preferences.json` instead

**Keep it current:**
- Re-read this before every new action
- Update it when you learn something new
- If a section gets stale, refresh it or remove it

---

## Quick Reference

See `quick-ref.md` for workflow selection and session start checklist.

---

## Knowledge vs Wiki Boundaries

**`knowledge/`** is extension-provided. It is wiped on reinstall — treat it as read-only reference.
- Purpose: documented patterns, how-tos, node reference
- Do not edit directly — use `wiki/contributions/` to propose changes

**`wiki/`** is your workspace. It persists across reinstalls.
- Purpose: user preferences, experiments, local overrides, working notes
- `wiki/` contents override `knowledge/` when they conflict

**Rule of thumb:** If you learn something new, write it to `wiki/`. If it belongs in the permanent knowledge base, propose it via `wiki/contributions/`.

---

## User Preferences

For explicit preferences (machine-readable), update `state/user-preferences.json`.

For notes and context, write here:
- **Favorites:** [nodes, workflows, settings this user prefers]
- **Naming conventions:** [how they name nodes/workflows]
- **Communication style:** [how they like to be updated]

---

## Cross-Workflow Observations

[How specific nodes behave across different workflows]

---

## Active Goals

- [What the user is working toward right now]

---

## Open Questions

- [ ] Things still being figured out

---

## Gotchas

**Watch out for these** — specific to this setup, easy to forget between sessions:

- [ ] [Model or node limitation — e.g. "X has memory issues with Y"]
- [ ] [Workflow requirement — e.g. "Z needs 512x768 resolution"]
- [ ] [Hardware limitation — e.g. "out of memory on steps > 20"]
- [ ] [Known error — e.g. "X crashes if Y is connected"]

**Rule:** When you hit something the hard way, add it here. Future sessions will thank you.

---

## Recent Learnings

- YYYY-MM-DD: 
- YYYY-MM-DD: 

---

## Active Contributions

Pending:
- `contributions/` — 

Submitted:
- 

---

## Session Context

**Last session:** 
**This session:**