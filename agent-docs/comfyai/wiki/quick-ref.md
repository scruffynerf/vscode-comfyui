# Quick Reference

**Read this first.** For details, see linked files.

---

## Workflow Selection

| Need | Workflow | Key Nodes |
|------|----------|-----------|
| text→image, fast test | Z-Turbo | ModelLoader, KSampler |
| text→image, quality | Portrait Gen | (see knowledge/workflows/) |
| image→image | Flux Edit | (see knowledge/models/flux.md) |
| inpainting | (see index.md) | |
| upscaling | (see knowledge/techniques/) | |

---

## Quick Commands

| Action | Trigger |
|--------|---------|
| Queue workflow | `apply-trigger.json` → `"command": "queue"` |
| Interrupt | `"command": "interrupt"` |
| Restart server | `"command": "restart-server"` |
| Refresh catalog | `"command": "refresh-catalog"` |
| Open panel | `"command": "open-panel"` |

---

## Key Files

| Purpose | File |
|---------|------|
| Current context | `wiki/index.md` |
| User preferences | `wiki/index.md` → User Preferences |
| Available models | `available-models.json` |
| Current workflow | `workflow-summary.md` |
| Node catalog | `nodes/classes/` |
| Find a node | `nodes/find-a-node.md` |

---

## Decision Tree

```
Need to generate from scratch?
  └── text→image? → fast test → Z-Turbo
                  └── quality → Portrait Gen / Flux
  └── image→image? → Flux Edit
  └── improve existing? → inpaint / img2img
  └── upscale? → (see upscalers.md)

Not sure? → Start with Z-Turbo (fastest feedback loop)
```

## Common Patterns

Documented node combinations in `wiki/patterns/`:
- [[lighting-portraits]] — portrait lighting setups
- [[quick-to-quality]] — Z-Turbo → Portrait Gen progression
- [[image-to-image-flows]] — Flux edit patterns

---

## Session Start Checklist

- [ ] Read `wiki/index.md` (includes Gotchas — watch out for setup-specific issues)
- [ ] Check `workflow-summary.md` for current state
- [ ] Review `wiki/sessions/` for recent activity
- [ ] Note user goals in index.md if new
