import fs from 'node:fs';
import yaml from 'js-yaml';

function compile(list) {
  return (list || []).map((s) => new RegExp(String(s), 'i'));
}

function normalizeDecision(d) {
  const x = String(d || '').toUpperCase();
  if (x === 'ALLOW') return 'ALLOW';
  if (x === 'BLOCK') return 'BLOCK';
  return 'CONFIRM';
}

function execDecision(policy, call) {
  const cmd = String(call?.input?.command || '');
  const exec = policy.exec || {};

  const allow = compile(exec.allowRegex);
  if (allow.some((r) => r.test(cmd))) {
    return { decision: 'ALLOW', reason: 'Matched exec allowlist.', ruleId: 'exec.allowlist' };
  }

  const block = compile(exec.blockRegex);
  for (const r of block) {
    if (r.test(cmd)) {
      return { decision: 'BLOCK', reason: `Matched exec block pattern: ${r.source}`, ruleId: 'exec.block' };
    }
  }

  const confirm = compile(exec.confirmRegex);
  for (const r of confirm) {
    if (r.test(cmd)) {
      return { decision: 'CONFIRM', reason: `Matched exec confirm pattern: ${r.source}`, ruleId: 'exec.confirm' };
    }
  }

  const def = normalizeDecision(policy.defaultDecision);
  return { decision: def, reason: 'Default posture.', ruleId: 'default' };
}

/**
 * Evaluate a ToolCall against the policy.
 * Returns {decision, ruleId, reason}.
 */
export function evaluate(policy, call) {
  if (!policy || typeof policy !== 'object') throw new Error('policy must be an object');
  if (!call || typeof call !== 'object') throw new Error('call must be an object');

  if (call.tool === 'exec') return execDecision(policy, call);

  // For now: we only implement exec.
  const def = normalizeDecision(policy.defaultDecision);
  return { decision: def, reason: 'Tool not implemented; default posture.', ruleId: 'default' };
}

export function loadPolicyYaml(path) {
  return yaml.load(fs.readFileSync(path, 'utf8'));
}
