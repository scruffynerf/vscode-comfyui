# Workflow Patterns

Read this file when you need to wire a standard pattern. When you are done, return to your task and apply the pattern.

---

## Negative conditioning: prefer `ConditioningZeroOut`

In most modern workflows, the negative conditioning input on `KSampler` does not need a full `CLIPTextEncode` + prompt. The idiomatic pattern is:

1. Take the output of your positive `CLIPTextEncode` (or any `CONDITIONING` output)
2. Pass it through `ConditioningZeroOut`
3. Wire the output to the `negative` slot of `KSampler`

This produces a neutral (zeroed) conditioning with no text encoder, no prompt decision, and no extra wiring.

**When to use a real negative prompt instead**: only when the user explicitly asks for one, or when using a model/workflow that is known to benefit from semantic negative conditioning (some SDXL workflows with specific LoRAs). The default assumption for a new workflow is zero-out.

---

<!-- TODO: Add more patterns as they are observed in test sessions. Candidates:
  - ControlNet conditioning stack (how to chain multiple ControlNets)
  - IP-Adapter + standard sampling
  - Tiling / seamless pattern
-->

Note: the hires fix (two-pass upscale) pattern has its own document — see `knowledge/hires-fix.md`.

This document is incomplete. If the pattern you need is not listed above, it is not yet documented — inform the user and proceed based on node schema information only.
