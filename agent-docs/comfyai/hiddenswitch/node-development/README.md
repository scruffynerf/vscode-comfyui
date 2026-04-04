# Custom Node Development

**Stop. Before writing any code, verify this is the right path.**

---

## Have you checked for an existing node?

Writing a custom node is expensive and creates ongoing maintenance. Do this first:

**1. Is there an installed node that already does this?**
Check [`comfyai/nodes/find-a-node.md`](../../nodes/find-a-node.md). The user may already have it.

**2. Is there a pip-installable node?**
Also in [`comfyai/nodes/find-a-node.md`](../../nodes/find-a-node.md). The hiddenswitch ecosystem has thousands of packaged nodes. Installing one takes seconds.

**3. Is there a community node you can install from git?**
Also covered in [`find-a-node.md`](../../nodes/find-a-node.md).

**4. Is there an existing node that's close — that could be modified?**
If yes, you *are* doing node development — forking an existing node is still writing code. Proceed below, but start from the existing node's source rather than from scratch. It's faster, and [`authoring.md`](authoring.md) covers the structure you'll be working within.

Only proceed here if checks 1–3 fail (nothing installable does the job) and the user explicitly needs something written or modified.

---

## If you're in the right place

Writing a custom node has these phases, in order:

| Phase | File |
|-------|------|
| Node structure, types, IS_CHANGED, model management | `knowledge/node-anatomy.md` |
| Design principles and pre-release checklist | `knowledge/best-practices.md` |
| Hiddenswitch packaging (entry-points, pyproject.toml) | [authoring.md](authoring.md) |
| Write-test-iterate loop (validate before promoting) | [tdd-loop.md](tdd-loop.md) |
| pytest patterns, fixtures, ProcessPoolExecutor | [testing.md](testing.md) |

Start with `knowledge/node-anatomy.md`. Return here for `authoring.md` once the node class is written.

**Promotion rule**: Never copy code directly into the user's `custom_nodes/` directory. Validate with the TDD loop first, then install via `uv pip install`. See [tdd-loop.md](tdd-loop.md) for the full promotion pattern.
