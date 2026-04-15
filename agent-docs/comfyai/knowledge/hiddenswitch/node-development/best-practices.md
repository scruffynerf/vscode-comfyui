# Node Development Best Practices

Read this alongside `authoring.md`. These principles govern design decisions — the structural rules for making a node that works well in real workflows, not just in isolation.

When you are done, continue to `tdd-loop.md` to validate your node.

---

## One node, one responsibility

A node that loads a model, processes an image, *and* applies an effect is three nodes. Split it. Single-purpose nodes are:
- easier to reuse in different workflows
- easier to test in isolation
- easier to debug when something goes wrong

---

## Respect ComfyUI's type system

Use the standard types (`IMAGE`, `LATENT`, `CONDITIONING`, `MODEL`, `CLIP`, `VAE`, etc.) whenever possible. Custom types are fine when needed, but document them. Never return a type that doesn't match your declared `RETURN_TYPES` — silent failures will break downstream nodes.

Tensor format conventions:
- `IMAGE`: `[batch, height, width, channels]` (B, H, W, C) — float32, 0–1 range
- `MASK`: `[batch, height, width]` (B, H, W) — float32, 0–1 range
- `LATENT`: a dict with key `"samples"` → tensor `[batch, channels, height, width]`

---

## Use clear, descriptive input names

```python
# Bad
"data": ("STRING",)

# Good  
"prompt_text": ("STRING",)
```

The input name appears in the UI and in error messages. Make it self-explanatory.

---

## Provide safe defaults

A node should produce a valid result without requiring configuration. Set meaningful defaults for every optional parameter. This makes nodes beginner-friendly and testable without wiring everything up first.

---

## Don't reload models in the execution function

If your node loads a model (checkpoint, clip, etc.), load it once and cache it. Reloading on every execution bottlenecks the entire workflow. Use `comfy.model_management` patterns (see `authoring.md`) for device and cache management.

---

## Handle errors explicitly

Validate inputs early. Provide clear error messages for edge cases (missing model, shape mismatch, out-of-range values). A node that crashes silently or raises an uninformative exception is much harder to debug than one that says what went wrong.

---

## No hidden side effects

Nodes must be deterministic given the same inputs and seed. No hidden global state, no silent mutation of input tensors. If randomness is involved, it must be controlled by an explicit seed input.

---

## Maintain backward compatibility

If you change a node's `INPUT_TYPES` or `RETURN_TYPES` after it has been used in saved workflows, those workflows will break. If breaking changes are necessary, version the node name (e.g. `MyNodeV2`) and keep the old one working.

---

## Pre-release checklist

Before presenting or merging a node:

- [ ] `INPUT_TYPES` classmethod has `required` and (if needed) `optional` sections
- [ ] `RETURN_TYPES` tuple matches what the function actually returns
- [ ] `RETURN_NAMES` provides clear display names for each output
- [ ] `FUNCTION` string matches the actual method name
- [ ] `CATEGORY` is set — use a sensible hierarchy, not a flat name
- [ ] `OUTPUT_NODE = True` if and only if the node is a terminal sink (save, preview)
- [ ] Tensor dimensions follow the B,H,W,C / B,H,W conventions above
- [ ] `NODE_CLASS_MAPPINGS` and `NODE_DISPLAY_NAME_MAPPINGS` are updated in `__init__.py`
- [ ] Tested in a real workflow chained with KSampler/VAEDecode/etc., not just in isolation
- [ ] Edge cases handled: empty tensors, mismatched sizes, missing optional inputs

---

## Test in real workflows, not just isolation

A node may work correctly alone but fail when chained. Test with:
- The actual nodes it will connect to (KSampler, VAE Decode, etc.)
- Multiple runs (not just one)
- Different resolutions and seeds

See `tdd-loop.md` for the full test cycle.
