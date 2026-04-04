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
- "Add a node to preview the mask before it goes into the sampler." 🔬 *(verify-type-first path — agent should check node-registry.json before adding)*

**What to check**: Does the agent check node-registry.json to verify the type is registered before adding? Does it use auto-layout after? Does the apply-response warn on unregistered types? Does apply-response.json confirm the addition?

---

## Group 5b: Removing Nodes / Links ✅🔬

Deletion is now supported via `remove_nodes` and `remove_links` in the patch. These were never tested in a real agent session.

- "Remove the preview node — I don't need it anymore." ✅🔬
- "Disconnect the LoRA from the pipeline but leave the node in the workflow." 🔬 *(remove_links without remove_nodes)*
- "Delete the KSampler and replace it with KSamplerAdvanced — reconnect everything." 🔬 *(atomic delete+recreate in one patch)*
- "Clean up the workflow — remove any nodes that aren't connected to anything." 🔬 *(agent must read state to identify orphans, then remove_nodes)*
- "Delete nodes 5, 7, and 9 all at once." ✅ *(batch removal)*
- "Remove that node but keep all its links going to something else." ❓ *(ambiguous — can't keep links from a deleted node; agent should clarify or explain)*

**What to check**: Does the agent use `remove_nodes` / `remove_links` correctly? Does `apply-response.json` show the removal count? Does the panel update without creating a new tab? For the delete+recreate case: does the agent issue a single patch with both `remove_nodes` and `nodes`? For the link-only disconnect: does it use `remove_links` with the actual link ID from `workflow-state.readonly.json`?

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
- "Find me a masking node that's already installed — I don't want to install anything new." 🔬 *(forces Step 1 only — installed nodes)*
- "I need a node that can blur a mask. Is that something I can get?" *(tests capability index → installed check)*

**What to check**: Does the agent follow the find-a-node.md four-step hierarchy? Does it check installed nodes first, then capability index, then registry-search? Does it avoid reading node-registry.json whole? Does it correctly distinguish installed vs. available when capability index lists a node?

---

## Group 8b: Custom Node Install via Git (appmana may be down) 🧱

Use these when appmana is unavailable or to test the git fallback path.

- "Install [some node pack] so I can use it." *(when appmana is down — should fall back to git clone)*
- "I want to use ComfyUI-post-processing-nodes. Can you install it?" 🧱 *(tests git fallback, restart required)*
- "I tried to add a node but it says it's not registered. How do I get it?"

**What to check**: Does the agent fall back to git install when appmana is unreachable? Does it correctly follow the clone + venv activation + restart pattern from install-custom-nodes.md? Does it know a server restart is required after installation?

---

## Group 9: Workflow History & Undo

These test the revert/history mechanism — patch history is written to `comfyai/workflow-history/` after every apply, but it has never been exercised in a real agent session.

- "Undo that." *(immediately after any patch — tests whether agent knows about workflow-history)* 🔬
- "Revert the workflow to how it looked at the start of our session."
- "What changes have you made so far this session?" *(tests whether agent reads workflow-history entries)*
- "Something looks wrong. Can you roll back to before the last change?" *(tests the actual revert protocol in workflow-history/README.md)*
- "The last patch broke the connections — put it back the way it was." 🔬

**What to check**: Does the agent find `comfyai/workflow-history/README.md`? Does it correctly use `sourcePath` to load a snapshot? Does it know what the snapshot format looks like (it's the `snapshotBefore` from the history entry)?

---

## Group 10b: Interrupt & Stop 🔬

The interrupt command (`{"command": "interrupt", "ts": N}`) has never been tested.

- "Stop! Cancel the generation." *(during an active generation)*
- "I queued something by accident — can you cancel it?"
- "Interrupt the current run." *(direct — should go straight to interrupt command)*

**What to check**: Does the agent know about the interrupt command? Does it send it correctly? Does `apply-response.json` confirm the interrupt? Does the panel actually stop?

---

## Group 11: Loading / Replacing Workflows

- "Load a new workflow — start from scratch." ❓ *(should clarify: replace current or new tab?)*
- "Here's a workflow file — can you load it into the panel?" *(if you have a .json handy)*
- "I want to start with a fresh empty canvas."

**What to check**: Does the agent use `sourcePath` trigger correctly for a full workflow load? Does it understand this creates a new tab (expected) vs. patch mode which edits in place?

---

## Group 12: Edge Cases and Stress Tests

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
| "What seed is the KSampler currently set to?" | workflow-summary.md shows seed | test4/GAP-2 (seed not in summary) |
| "Set the seed control to increment mode." | control_after in widgets_values | test4/GAP-5 (seed modes undocumented) |
| "Change this node's type to KSamplerAdvanced." | apply-response warns, type preserved | test4/BUG-3 (type change silently ignored) |
| "Add a PreviewImage node." | Verifies type in node-registry first | test4/GAP-3 (unregistered type silently dropped) |
| "Remove the preview node." | Uses remove_nodes, apply-response shows removal count | deletion (new — never tested) |
| "Disconnect the LoRA from the pipeline but leave the node." | Uses remove_links with link ID from state | deletion (new — never tested) |
| "Delete the KSampler and add a KSamplerAdvanced in its place." | Single patch with remove_nodes + nodes | atomic delete+recreate (new — never tested) |

---

## Session Progression Template (generic)

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

---

## Scripted Sessions — Targeted Test Runs

These are complete session scripts targeting specific untested areas. Each has a focus, a suggested command arc, and what to watch for. Run one per session.

---

### Session Script A: "Time Traveler" — Workflow History & Undo

**Focus**: Workflow history, revert, and what agents do when asked to undo changes. The history mechanism has never been exercised. Also tests node deletion (now supported via `remove_nodes`).

**Command arc**:

1. *(Group 0)* "What's in my current workflow?"
2. *(Group 1)* "Change the positive prompt to: a hyperrealistic oil painting of a wolf howling at the moon."
3. *(Group 1)* "Increase steps to 35 and switch the sampler to DPM++ 2M Karras."
4. *(Group 2)* "Queue it."
5. *(Group 9)* "Actually, undo the last change — put the sampler back the way it was." 🔬
6. *(Group 9)* "How many changes have you made so far this session? Can you summarize them?" 🔬
7. *(Group 9)* "Revert everything back to the start — I want the original workflow." 🔬
8. *(Group 5b)* "The old KSampler node is cluttering things up. Can you remove it?" ✅🔬 *(deletion now works — agent should use remove_nodes)*
9. *(Regression)* "What seed is currently set?"

**What to watch for**:
- Does the agent find `comfyai/workflow-history/README.md` without prompting?
- Does it correctly load a snapshot via `sourcePath`?
- Does it correctly interpret `snapshotBefore` format in history entries?
- When asked to delete a node, does it use `remove_nodes` correctly? Does apply-response confirm the removal count?
- Does workflow-summary.md reflect the reverted state after a full reload?

---

### Session Script B: "Chaos Agent" — Interrupt, Errors & Recovery

**Focus**: Interrupt command (never tested), error recovery, and what the agent does when patches partially fail or the server behaves unexpectedly.

**Command arc**:

1. *(Group 0)* "What's in my current workflow?"
2. *(Group 1)* "Set steps to 50 and queue it." *(long run — gives time for interrupt)*
3. *(Group 10b)* "Stop! Cancel that generation." 🔬 *(interrupt — has this ever worked?)*
4. *(Group 1)* "Change the sampler to `not_a_real_sampler`." 🧱 *(invalid COMBO value — what does apply-response say? Does the panel show an error on queue?)*
5. *(Group 2)* "Queue it." *(should fail or produce an error — what does agent observe?)*
6. *(Group 7)* "Something seems wrong. Can you figure out what happened?" *(tests log reading + apply-response interpretation)*
7. *(Group 1)* "Fix whatever's wrong and queue a normal run." *(recovery path)*
8. *(Regression)* "Change this KSampler's type to KSamplerAdvanced." 🔬 *(type-change warning test)*

**What to watch for**:
- Does interrupt command work? Does `apply-response.json` confirm it? Does generation stop?
- Does the agent catch the invalid sampler value before patching, or only notice after?
- When things go sideways, does the agent read `comfyui.log` and `apply-response.json` or ask the user?
- Does the type-change warning appear in apply-response with a clear message?

---

### Session C: "Silent Explorer" — Model Awareness + Hiddenswitch Silent Execution

**Focus**: `available-models.json` in real use, model switching, and silent hiddenswitch execution. No appmana — node discovery is installed-only + git.

**Command arc**:

1. *(Group 0)* "What's in my current workflow?"
2. *(Group 4)* "What models do I have installed?" *(reads available-models.json)* 🔬
3. *(Group 4)* "Which of these would be best for generating photorealistic portraits?" *(tests model reasoning — agent should use server-info.json + available-models.json)*
4. *(Group 4)* "Switch the checkpoint to [whatever's available]." *(patch + verify)*
5. *(Group 6)* "Run the workflow silently — I don't want to see it in the panel. Just tell me the output path." 🔬
6. *(Group 6)* "Run it 3 more times silently with different seeds and list all the output files." 🔬
7. *(Group 8)* "What masking nodes do I already have installed? Don't install anything new." 🔬 *(installed-only search)*
8. *(Group 8b)* "I want to use the WAS Node Suite. Can you install it without appmana?" *(git install path)*

**What to watch for**:
- Does available-models.json give enough info for the agent to reason about model choice?
- Does the model type gap (AIO vs. diffusion-only) cause any confusion? *(open TODO item)*
- Does silent execution use the CLI path first? Does it parse output correctly?
- When appmana is unavailable, does the agent fall back to git without prompting?
- Does the agent stay on installed-only search when explicitly told not to install?
