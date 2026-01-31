# protect-the-lobster

Standalone “warn + confirm” (Windows UAC-style) **tool-call firewall** for Clawdbot/Moltbot.

Primary goal: reduce prompt-injection impact by ensuring **tool calls are gated** before execution.

> Current focus: `exec`.

## What it does
Given a proposed tool call:

```json
{
  "tool": "exec",
  "input": {"command": "cat ~/.ssh/id_rsa"}
}
```

Evaluate it against `policy.yaml` and return a decision:
- `ALLOW`
- `CONFIRM` (ask user YES/NO)
- `BLOCK`

## Default posture
`policy.yaml` is configured for:
- **CONFIRM unless explicitly allowlisted**
- **BLOCK** for common prompt-injection / exfil / RCE patterns (e.g., `curl | bash`)

## Install
```bash
npm install
```

## CLI usage
### 1) Create ToolCall JSON for exec
```bash
node src/cli.js exec-to-json --command "ls -la" --out /tmp/lobster-exec.json
```

### 2) Evaluate
```bash
node src/cli.js eval --policy ./policy.yaml --input /tmp/lobster-exec.json
```

### 3) Format a WhatsApp-friendly approval prompt
```bash
node src/cli.js format-confirm --command "cat /etc/os-release" --reason "Default posture."
```

Produces:
```
Security check: needs approval
Command: cat /etc/os-release
Reason: Default posture.
Reply YES to run, or NO to cancel.
```

## Examples
```bash
node src/cli.js eval --policy policy.yaml --input examples/exec-safe.json
node src/cli.js eval --policy policy.yaml --input examples/exec-confirm.json
node src/cli.js eval --policy policy.yaml --input examples/exec-block.json
```

## Clawdbot usage (Option 1 wrapper)
This repo itself is standalone, but it’s designed to be used as a wrapper workflow.
See `docs/clawdbot-integration.md`.

To ensure an OpenClaw instance **always** uses this protection, use the skill provided in `clawdbot-skill/lobster-safe-exec/`. It is configured with mandatory instructions to intercept all `exec` requests, preventing the agent from running raw commands without first evaluating them against the policy.

## Roadmap
- Add structured reason codes + redaction
- Extend beyond `exec`: `read/write/edit`, `web_fetch`, `browser` navigation, `message.send`
- Optional: full Gateway/tool-policy integration

