# Clawdbot Tool Firewall (Standalone)

A standalone “warn + confirm” policy engine for Clawdbot/Moltbot-style tool calls.

## Goal
Prevent prompt-injection from turning into real-world actions by gating **tool calls**.

This repo is **not integrated** into your running Clawdbot yet.

## Concept
Given a proposed tool call:

```json
{
  "tool": "exec",
  "input": {"command": "cat ~/.ssh/id_rsa"}
}
```

Evaluate it against `policy.yaml` and return a decision:
- `ALLOW`
- `CONFIRM` (warn + require approval)
- `BLOCK`

Also supports redaction and audit logs.

## Planned scope (MVP)
- Tools: `exec`, `read/write/edit`, `web_fetch`, `browser` navigation, `message.send`
- Rule actions: allow / confirm / block
- Matchers: tool name, URL domains, file paths, command patterns, recipient allowlist
- Output: decision + reason codes + suggested safe alternative

## Next
- Implement rule schema + evaluator
- Provide a CLI: `tool-firewall eval --policy policy.yaml --input examples/*.json`

