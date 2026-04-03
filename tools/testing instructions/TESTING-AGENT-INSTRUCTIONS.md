# Testing Agent Instructions

You are evaluating the vscode-comfyui extension from an AI agent's perspective.
Your job: **act like a real agent helping a user**, while simultaneously **documenting your experience** so the developers can improve the extension and its docs.

---

## Setup

At the start of your session:

1. Create the session directory: `feedback/<session-name>/` (short descriptive name, e.g. `test4`)

2. **Enable testing mode immediately** — write this to `comfyai/apply-patch-trigger.json`:
   ```json
   {"command": "testing-mode", "logPath": "feedback/<session-name>", "ts": 1}
   ```
   Read `comfyai/apply-response.json` to confirm. From this point on, **every** response you get back from the extension will contain two fields:
   - `log_file` — the exact path to write your log entry for this action (e.g. `feedback/test4/log-1001.md`)
   - `testing_reminder` — a prompt telling you what to record

3. At the end, write `summary.md` — structured findings (format below).

4. Disable testing mode when done:
   ```json
   {"command": "testing-mode", "enabled": false, "ts": 9999}
   ```

---

## How logging works

Every time you write a trigger and read the response, you will see:

```json
{
  "status": "ok",
  "message": "Patch applied: 1 node(s), 0 link(s)",
  "trigger_ts": 1005,
  "log_file": "feedback/test4/log-1005.md",
  "testing_reminder": "STOP. Write feedback/test4/log-1005.md now ..."
}
```

**When you see `log_file`, write that file before doing anything else.** It is a new file every time — use the Write tool, no read required. The file name is unique so there is no risk of collision.

Log entries are small. A typical one is 10–20 lines. Speed matters more than polish — write it fast, then continue.

---

## What to put in each log file

```markdown
# [T+Xm] <One-line description of what this action was>

**Trying to**: <What the user asked, or what you were attempting>
**Action**: <Exact content you sent — quote the trigger, patch, or command>
**Expected**: <What you thought would happen>
**Actual**: <What actually happened — quote the response, output, or error exactly>
**Analysis**: <Why you think this happened. If you're not sure, say so.>
**Next**: <What you're doing next and why you chose it over other options>
```

### Also capture these — they're the most valuable data points:

**Confusion or uncertainty** — if you weren't sure which approach to take, which doc to read, or what a field meant: say so. "I wasn't sure whether to use patchPath or sourcePath here because the README example only shows one case."

**User corrections** — when the user says "no, not that" or tells you you've misunderstood something, quote them and explain your original interpretation:
```
**USER CORRECTION**: User said: "on the desktop means in the ComfyUI panel"
I had read "desktop" as the OS filesystem ~/Desktop. The docs don't define what
"the current workflow" means from an agent's perspective.
```

**Dead ends and wrong turns** — if you tried approach A, it failed, and you switched to B: log it. "Tried the remote client first because the server was running. Got 0-byte result with no error. Switched to CLI."

**Anything you had to ask the user** — and why you couldn't figure it out from the docs alone.

**Things that worked on the first try** — positive signal matters too. "Patch applied immediately, response was clear, summary updated as expected."

**Doc/reality mismatches** — "The doc said X, but Y happened."

**You don't always get a trigger response** — sometimes things happen between triggers (user corrections, doc reads, failed commands). Don't wait for a trigger to log these. Write an extra log file for them:
```json
{"command": "testing-mode", "logPath": "feedback/<session-name>", "ts": <next-ts>}
```
...or just write `log-note-<something>.md` directly.

---

## When to write a log entry (not just on triggers)

The trigger-based reminders catch the actions you take through the extension. But important things also happen outside triggers:

- **You read a doc and it confused you** → log it
- **You asked the user a clarifying question** → log it  
- **A command failed** → log it before trying again
- **You made an assumption** → log it ("I assumed node IDs were stable across sessions")
- **The user corrected you** → log it immediately

Write these as extra files: `log-note-clarification.md`, `log-note-command-failure.md`, etc. Anything that reveals friction or confusion is worth capturing, even if no trigger was involved.

---

## Things NOT to skip

From past sessions, these were the most consistently missed — and most useful when we did get them:

- **Why you chose approach X over Y** — the reasoning reveals doc gaps
- **What you read and what it told you** — "find-a-node.md said try installed nodes first, so I searched the registry"
- **Gaps where no doc answered your question** — if you had to guess, that's a doc bug
- **Anything you had to try twice** — first attempt tells us what was ambiguous
- **Node type names, IDs, and exact patch content** — these let us reproduce issues

---

## End-of-session summary

Write `feedback/<session-name>/summary.md`:

```markdown
# Session Summary
**Date**: YYYY-MM-DD
**Duration**: ~X minutes
**Environment**: [OS, ComfyUI version, device, Python version, server launch flags]

## What Worked (and worked immediately)
[Short list — what succeeded on first try]

## Bugs Found
### BUG-N: <Short title>
**Severity**: Critical / High / Medium / Low
**Steps to reproduce**: [Exact files written, trigger content, sequence]
**Evidence**: [Quote the error, user report, or file state that confirmed it]
**Root cause hypothesis**: [Your best guess]
**Log file**: [Which log-NNN.md has the detail]

## Documentation Gaps
### GAP-N: <Short title>
**Where**: [Which file/section was missing or wrong]
**What I needed**: [What would have helped]
**What I did instead**: [The workaround, or "I had to ask the user"]
**Log file**: [Which log-NNN.md has the detail]

## What the Agent Couldn't See
[Information you needed but had no file access to — server config, model metadata,
execution status, error details only visible in the panel UI, etc.]

## Agent Behavior Mistakes
[Things you did wrong that better docs or tooling could have prevented.
Be honest — this is the section developers use to fix docs.]

## Priority Recommendations
### Must Fix
### Should Fix  
### Nice to Have
```

---

## Timing

No real-time clock access is fine. Use session-relative time:
- T+0 = session start
- T+5m, T+15m, T+30m, etc.

For trigger `ts` values: use any incrementing integers. Never present a fabricated Unix timestamp as real.

---

## What to look for

### Documentation
- Does the entry point route you to the right place immediately?
- Does each doc tell you what to do next, or do you dead-end?
- Are there instructions that assume context you don't have?
- Are there things you had to figure out that should have been stated?

### Mechanisms (patch, queue, response)
- Did the mechanism work on the first try with the documented format?
- Was `apply-response.json` always present and useful?
- Was feedback enough to know what happened, or did you have to ask the user?
- Did `workflow-state.readonly.json` and `workflow-summary.md` reflect reality?

### Error handling
- When something failed, how did you find out?
- Were error messages actionable?
- Did silent failures occur (action completed, no error, wrong result)?

### Mode routing
- Were you ever unsure whether to use GUI bridge vs. hiddenswitch?
- Did the docs resolve that without you having to ask?

### Models
- Could you tell which models were already on disk?
- Could you tell model type from `available-models.json`?
- Did `server-info.json` explain the performance context?
