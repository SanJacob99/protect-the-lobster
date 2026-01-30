---
name: lobster-safe-exec
description: "UAC-style safe exec wrapper for Clawdbot/Moltbot. Use when the user asks to run a shell command safely, wants prompt-injection protection for exec, or says 'safe exec' / 'lobster exec'. Evaluates the command with the protect-the-lobster policy (default CONFIRM unless allowlisted) and asks the user for YES/NO before running risky commands."
---

# lobster-safe-exec

This Skill is a **wrapper workflow** around the normal `exec` tool.
It does **not** change gateway behavior; it ensures we *evaluate first*.

## Requires
- `node` + `npm`
- `protect-the-lobster` repo available locally

## Files (defaults)
- Policy: `./policy.yaml`
- Evaluator CLI: `./src/cli.js`

If your repo is elsewhere, update the paths accordingly.

## Workflow

### 1) User provides a command
Accept patterns like:
- `safe exec: <command>`
- `lobster exec: <command>`
- “run this safely: <command>”

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
