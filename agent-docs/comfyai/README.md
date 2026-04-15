# ComfyAI Agent Protocol

## Which mode?

**Does the user want to SEE this in their ComfyUI panel?**
→ GUI bridge. Write patch to workflow-patch.json, trigger via apply-trigger.json. See knowledge/reference/apply-trigger-reference.md.

**Does the user want to RUN what's already in the panel?**
→ Write `{"command": "queue", "ts": N}` to apply-trigger.json. Done.

**Silent run, testing code, building a node?**
→ hiddenswitch Python. See knowledge/hiddenswitch/README.md.

When in doubt: ask the user which they prefer.

---

## What you can write to

| File/Directory | Write to this |
|---|---|
| `wiki/` | Your workspace: notes, contributions, sessions |
| `apply-trigger.json` | Triggers: patch apply, queue, restart, commands |
| Any `.json` patch file | Workflow changes |

**Read-only:** workflow-summary.md, workflow-state.readonly.json, apply-response.json, server-info.json, available-models.json, nodes/

---

## Where to find things

| What you need | Where |
|---|---|
| Pattern knowledge | knowledge/index.md |
| Node catalog | nodes/README.md |
| Troubleshooting | knowledge/reference/troubleshooting.md |
| Patch history | workflow-history/ |
| Your notes | wiki/ |

---

## Reading state efficiently

**ALWAYS re-read workflow-summary.md right before ANY patch or queue action.**

The file changes on ANY user interaction in the ComfyUI panel. If you read it once and hold in context, you're working with stale data.