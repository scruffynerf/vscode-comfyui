# Future Plans: VS Code ComfyUI Extension

## Vision

Make ComfyUI as scriptable and observable as a standard codebase — for both humans and AI agents.

The editor panel is the viewport. The file-based bridge is the API. The goal is to let agents read, reason about, and modify complex generative pipelines using nothing more than the filesystem, without requiring manual UI interaction.

## Themes

### AI-First Workflow
The extension should provide enough context that an agent can understand and modify any workflow without ever reading raw JSON by default. Summary, hints, and structured metadata should do the heavy lifting.

### Robust Agent Bridge
The file-based bridge (state/patch/apply) should be reliable, atomic, and well-documented. Agents should be able to trust what they read and have confidence their writes land correctly.

### Execution & Observability
Agents should eventually be able to trigger runs, monitor progress, and retrieve outputs — closing the loop from "edit workflow" to "see result" without leaving the editor.

### ComfyUI as a Python Library: The Hiddenswitch Advantage

The [Hiddenswitch fork](https://github.com/hiddenswitch/pip-and-uv-installable-ComfyUI) is a first-class citizen of this extension not just for installation convenience, but because of a capability that unlocks a fundamentally different development model: **ComfyUI can be imported and executed as a Python library**, without any running server, without any GUI, and without touching the user's active environment.

This matters enormously for AI-assisted node development. The traditional workflow for building a custom ComfyUI node is:

1. Write Python code
2. Restart the ComfyUI server
3. Open the GUI
4. Wire up a test workflow by hand
5. Queue a run and check the output
6. Repeat from step 1

Every step after step 1 requires a human in the loop. With Hiddenswitch, an AI agent can collapse steps 2–6 into a single automated loop:

**What this enables:**
- An agent can write a new custom node in Python, as usual
- Write Python unit tests for the underlying functions, as usual
- Construct a test workflow programmatically (as a Python dict or JSON) that exercises the new node
- Execute that workflow by calling Hiddenswitch directly as a Python library — no server, no GUI, no API call
- Receive the outputs (images, tensors, metadata) as Python objects and assert on them
- Iterate on the node code and re-run the test workflow in seconds, entirely within the terminal

This is **complete TDD for ComfyUI nodes**: write code, write tests, run tests, get results, iterate — all without any user interaction and without polluting the user's live ComfyUI environment.

Only once the node is validated does it graduate to the user's `custom_nodes` folder and live workflow.

**The separation of concerns is key:** the agent operates in its own Hiddenswitch instance (or a separate process using the installed workspace), and the user's running ComfyUI server remains untouched until the agent explicitly promotes code to it. VRAM and compute contention is a real constraint — agents should be aware of the shared resource and avoid running large workflows while the user's server is active.

**Near-term implications for this extension:**
- The `comfyui.installDir` workspace becomes more than just a server install — it is the agent's sandbox
- The execution API (queue/interrupt via apply file) is a convenience for the GUI path; the deeper capability is scripted execution via Hiddenswitch Python, which doesn't go through the extension at all
- Future tooling should help agents construct, run, and inspect workflows programmatically, not just patch the GUI graph

This theme is the long-term north star for what "AI-assisted ComfyUI development" means in this extension.


### Human Tools
Where visualization, diffing, or inspection tools help human developers understand and debug workflows, they belong here too — but they're secondary to the agent use case.

---

See `TODO.md` for the prioritized implementation backlog.
