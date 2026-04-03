# User Commands — Test Script

Commands to give to the testing agent, organized by what they exercise. Start simple, escalate.
Pull from whichever section is relevant to what you're currently testing or debugging.

Each command is written as you'd say it — natural user language, not technical spec. That's the point.
The agent should figure out the right path from the docs, not from a hint in the phrasing.

**Symbol key**:
- ✅ Known-good path (confirm it still works)
- 🔬 Exercises a specific fix or edge case
- ❓ Ambiguous — agent should ask a clarifying question
- 🧱 Likely to hit a wall — tests error handling or doc gaps

---

## Group 0: Orientation (start every session with one of these)

These test whether the agent correctly reads the entry point docs before acting.

- "What can you do with this extension?"
- "I want to work with my ComfyUI workflow. Where do you start?"
- "Help me with ComfyUI." *(completely open — tests initial orientation)*
- "What's in my current workflow?"
- "Explain what the current workflow does."
- "What does the workflow currently have loaded?"

**What to check**: Does the agent read `COMFYUI_AGENT_GUIDE.md` and `comfyai/README.md` before doing anything else? Does it read `workflow-summary.md` to answer the workflow question instead of parsing the raw JSON?

---

## Group 1: Basic Patch Operations (core feature, was broken in test1)

These exercise the patch mechanism. In test1, nothing in this group worked. They should all work now.

### Prompt changes
- "Change the positive prompt to: a photorealistic portrait of an astronaut on Mars, golden hour lighting, highly detailed"
- "Make the prompt more cinematic. Add film grain and anamorphic lens flare to whatever's in there."
- "Change the negative prompt to avoid cartoons and anime."

### Node repositioning
- "Rearrange the nodes so they're easier to read — more space between them." ✅🔬
- "Lay out the nodes more logically — left to right in pipeline order."

### Settings tweaks
- "Increase the number of steps to 30."
- "Set CFG scale to 7."
- "Switch the sampler to DPM++ 2M."

**What to check**: Does `apply-response.json` appear after each patch? Does the workflow-summary.md update? Does the change appear in the panel without a new tab? (New tab was BUG-2, fixed.)

---

## Group 2: Queue / Run (core feature, was broken in test1)

- "Run the workflow." ❓ *(ambiguous — should trigger the routing questions: GUI panel or silent? If there's a workflow loaded, answer should be GUI bridge queue command.)*
- "Queue the current workflow." ✅🔬 *(less ambiguous — should go straight to queue command)*
- "Generate an image from the current workflow and show me the result."
- "Run it again." *(after a successful queue — tests repeat)*

**What to check**: Does the queue trigger work? Does `apply-response.json` confirm it? Does anything actually happen in the panel?

---

## Group 3: Mode Routing (ambiguous requests — agent should ask)

These are genuinely ambiguous. The agent should ask a clarifying question before proceeding, per the docs.

- "Make me a photo of a kitten." ❓
- "Generate an image of a sunset." ❓
- "Run the workflow on this file: [some path]." ❓
- "Edit the workflow to produce a landscape." ❓ *(what kind of edit? How?)*
- "I want to test something silently before showing it to the user." ❓ *(which mode?)*

**What to check**: Does the agent ask before acting? Does it correctly identify that these could go either way and route correctly once you clarify?

---

## Group 4: Model Awareness

- "What models do I have installed?" ✅ *(should read available-models.json)*
- "Switch to a different checkpoint — something faster." 🔬 *(needs to reason about what's available)*
- "What checkpoint is currently loaded in the workflow?"
- "Is [some model name] available?" *(can be any model name — ideally one that IS and one that ISN'T)*
- "Switch the model to something that will generate faster." *(tests whether agent checks server-info.json for context before recommending)*

**What to check**: Does the agent use `available-models.json` rather than listing directories? Does it understand the distinction between models that are local vs. would need downloading?

---

## Group 5: Adding Nodes

- "Add a preview node so I can see intermediate results without saving."
- "Add a second prompt — I want to combine two positive prompts with different weights."
- "Connect a LoRA node to the pipeline."
- "I want to upscale the output. Add the appropriate nodes."

**What to check**: Does the agent know to use the node catalog (find-a-node.md) rather than guessing node names? Does the patch correctly add new nodes and links? Does apply-response.json confirm the addition?

---

## Group 6: Hiddenswitch / Silent Execution

Use these after a routing clarification where the user wants a silent run (not in the panel).

- "Run the current workflow silently and tell me the path to the output image." ✅
- "Queue a test generation silently — I don't want to see it in the panel yet."
- "Run the workflow 3 times with different seeds and show me all the output paths."

**What to check**: Does the agent use the CLI path first (most reliable)? Does it avoid the embedded Python path on macOS without the `if __name__` guard? Does it correctly parse the CLI output JSON?

---

## Group 7: Debugging / Error Scenarios 🧱

- "Something seems wrong — the workflow didn't generate anything. Can you figure out why?"
  *(requires reading comfyui.log — tests log awareness)*
- "The last run took 20 minutes and seems stuck. What's going on?"
  *(tests server-info.json reading and --novram explanation)*
- "I got an error when I queued the workflow. What happened?"
  *(tests apply-response.json reading + log reading)*
- "Why is generation so slow?"
  *(tests whether agent reads server-info.json to explain --novram / device context)*

**What to check**: Does the agent go straight to `user/comfyui.log`? Does it read `server-info.json`? Does it correctly interpret the log and give actionable advice?

---

## Group 8: Custom Node Discovery

- "I want to add a node that can remove backgrounds from images."
- "Is there a node that does face restoration or upscaling?"
- "I need a node that can read text from an image (OCR)."
- "What nodes are installed that deal with LoRA?"

**What to check**: Does the agent follow the find-a-node.md four-step hierarchy? Does it check installed nodes first, then capability index, then registry-search? Does it avoid reading node-registry.json whole?

---

## Group 9: Loading / Replacing Workflows

- "Load a new workflow — start from scratch." ❓ *(should clarify: replace current or new tab?)*
- "Here's a workflow file — can you load it into the panel?" *(if you have a .json handy)*
- "I want to start with a fresh empty canvas."

**What to check**: Does the agent use `sourcePath` trigger correctly for a full workflow load? Does it understand this creates a new tab (expected) vs. patch mode which edits in place?

---

## Group 10: Edge Cases and Stress Tests

- "Edit the workflow." *(no specifics — agent should ask what to change)*
- "Make it better." *(completely vague — agent should ask for clarification)*
- "Do something interesting." *(open-ended — test how agent handles no clear task)*
- "I have a workflow on the desktop." *("desktop" could mean filesystem or ComfyUI panel — from test1, this caused confusion. Should now route to asking or reading workflow-summary.md)*
- "Run it." *(after any previous operation — reference to prior context, tests whether agent knows what "it" is)*
- "Undo that." *(tests whether agent knows about workflow history or patch reversal)*

---

## From Fixed Bugs — Regression Tests

Each of these maps to a specific bug found in testing. Run these to confirm fixes hold.

| Command | Tests | Bug |
|---------|-------|-----|
| "Move the KSampler node 200px to the right." | Patch applies in-place | BUG-1 (patch never applied) |
| "Change the prompt and then run it in the panel." | No new tab created | BUG-2 (new tab on every edit) |
| "Queue the workflow." then read apply-response.json | Queue confirmation exists | Queue was broken + no response |
| "What's in the workflow?" | Reads workflow-summary.md | MED-6 (empty state confusion) |
| "Can you see the server logs?" | Reads user/comfyui.log | MED-4 (log not in docs) |
| "What models are available?" | Reads available-models.json | MED-3 (no model visibility) |

---

## Session Progression Template

If you're running a full test session and want a structured arc:

1. Pick one from **Group 0** — orientation
2. Pick two from **Group 1** — basic patches
3. One from **Group 2** — queue
4. One from **Group 3** — ambiguous routing
5. One from **Group 4** — model awareness
6. One from **Group 5** — add a node
7. One from **Group 7** — debug something
8. One or two from **Regression Tests**

Don't rush through all groups in one session. Fewer commands done thoroughly (with note-taking) is more useful than many commands done quickly.
