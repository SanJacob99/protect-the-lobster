# Clawdbot integration (design notes)

This repo is **standalone**. This doc explains how Clawdbot could use it for `exec`.

## 1) Represent an exec tool call as JSON

Clawdbot already has a conceptual tool call:

- tool: `exec`
- input: `{ command, workdir, timeoutMs, elevated, ... }`

The minimal JSON shape used by protect-the-lobster is:

```json
{
  "tool": "exec",
  "input": { "command": "ls -la" }
}
```

Helper (Node):

```js
import { execToToolCall } from 'protect-the-lobster/src/index.js';
const call = execToToolCall('ls -la', { timeout: 60000 });
```

## 2) Run evaluation before executing

Pseudo-flow inside Clawdbot:

1. Create ToolCall JSON from the intended `exec`.
2. Evaluate with policy.
3. If ALLOW -> run exec.
4. If BLOCK -> refuse.
5. If CONFIRM -> ask user, await YES/NO.

```js
import { evaluate, loadPolicyYaml, formatConfirmPrompt } from 'protect-the-lobster/src/index.js';

const policy = loadPolicyYaml('/path/to/policy.yaml');
const call = { tool: 'exec', input: { command } };
const decision = evaluate(policy, call);

if (decision.decision === 'ALLOW') {
  // run exec
}

if (decision.decision === 'BLOCK') {
  // refuse + provide safer alternative
}

if (decision.decision === 'CONFIRM') {
  const prompt = formatConfirmPrompt({ command, reason: decision.reason });
  // send `prompt.text` to user, then wait for YES/NO
}
```

## 3) Approval prompt format (WhatsApp-friendly)

```
Security check: needs approval
Command: <exact command>
Reason: <policy reason>
Reply YES to run, or NO to cancel.
```

## 4) Mapping user reply -> approve/deny

This repo does **not** implement session state.
Recommended minimal approach:
- Clawdbot stores `{approvalId -> pending action}` in memory
- If user replies YES/NO, map to approve/deny and proceed.

