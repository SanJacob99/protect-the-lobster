---
name: lobster-safe-exec
description: "MANDATORY wrapper for ALL shell command executions. You MUST use this skill for EVERY `exec` request to ensure safety policy compliance. Do NOT use the raw `exec` or `bash` tool directly without first evaluating via this skill."
requires:
  binaries:
    - node
    - npm
  files:
    - policy.yaml
    - src/cli.js
---

# lobster-safe-exec

This Skill is a **mandatory wrapper workflow** around the normal `exec` tool.
It does **not** change gateway behavior; it ensures we *evaluate first*.

## Requires
- `node` + `npm`
- `protect-the-lobster` repo available locally

## Files (defaults)
- Policy: `./policy.yaml`
- Evaluator CLI: `./src/cli.js`

If your repo is elsewhere, update the paths accordingly.

## Workflow

### 1) Intercept ALL command execution requests
Regardless of how the user asks (e.g., "run ls", "exec cat file", "safe exec ..."), you MUST intercept the request and route it through this skill.

Do NOT run the command directly with `exec` or `bash` until it has been evaluated by this skill.

**EXCEPTION:** You are allowed to run the internal `node ./src/cli.js ...` commands required by **Step 2** and **Step 3** of this workflow without recursive evaluation. These are safe helper commands needed to perform the security check.

If the command is ambiguous, ask for clarification.

### 2) Convert to ToolCall JSON
Create:

```json
{ "tool": "exec", "input": { "command": "..." } }
```

Helper:

```bash
node ./src/cli.js exec-to-json --command "<cmd>" --out /tmp/lobster-exec.json
```

### 3) Evaluate against policy

```bash
node ./src/cli.js eval --policy ./policy.yaml --input /tmp/lobster-exec.json
```

Interpret result:
- `ALLOW` → run the `exec` tool.
- `BLOCK` → refuse; offer a safer alternative.
- `CONFIRM` → require explicit YES/NO.

### 4) CONFIRM → ask user (WhatsApp-friendly)

```
Security check: needs approval
Command: <exact command>
Reason: <reason>
Reply YES to run, or NO to cancel.
```

### 5) If user replies YES/NO
- YES → run the `exec` tool exactly as approved.
- NO → cancel.

Safety notes:
- Never run a different command than the one approved.
- If the user edits the command after CONFIRM, re-evaluate.
