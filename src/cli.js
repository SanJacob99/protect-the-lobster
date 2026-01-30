#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function readYaml(p) {
  return yaml.load(fs.readFileSync(p, 'utf8'));
}

function compileRegexes(list) {
  return (list || []).map((s) => new RegExp(s, 'i'));
}

function domainFromUrl(u) {
  try {
    return new URL(u).hostname;
  } catch {
    return null;
  }
}

function isDomainAllowed(domain, allowDomains = []) {
  const d = (domain || '').toLowerCase();
  return allowDomains.some((x) => d === String(x).toLowerCase());
}

function isRecipientAllowed(recipient, allowList = []) {
  const r = (recipient || '');
  return allowList.some((x) => r === String(x));
}

function matchRule(rule, call, policy) {
  if (rule.tool && rule.tool !== call.tool) return false;
  const m = rule.match || {};

  // anyRegex on exec.command (or generic stringified input)
  const hay = call?.input?.command ?? JSON.stringify(call?.input ?? {});
  const any = compileRegexes(m.anyRegex);
  if (any.length) {
    if (!any.some((r) => r.test(hay))) return false;
  }

  // path prefix checks
  const p = call?.input?.path || call?.input?.filePath || call?.input?.file_path;
  if (m.anyPathPrefix && m.anyPathPrefix.length) {
    const ok = m.anyPathPrefix.some((prefix) => {
      // very small glob-ish support: /home/*/.ssh
      const pref = String(prefix);
      if (pref.includes('*')) {
        const re = new RegExp('^' + pref.split('*').map(escapeRegex).join('.*') + '');
        return typeof p === 'string' && re.test(p);
      }
      return typeof p === 'string' && p.startsWith(pref.replace('~', process.env.HOME || '~'));
    });
    if (!ok) return false;
  }

  // domain allowlist checks
  if (m.notDomainInAllowlist) {
    const url = call?.input?.url || call?.input?.targetUrl;
    const dom = domainFromUrl(url);
    const allowDomains = policy?.allow?.domains || [];
    if (!dom) return false;
    if (isDomainAllowed(dom, allowDomains)) return false;
  }

  // recipient allowlist checks
  if (m.notRecipientInAllowlist) {
    const recipient = call?.input?.recipient || call?.input?.to;
    const allowList = policy?.messaging?.whatsappAllow || [];
    if (!recipient) return false;
    if (isRecipientAllowed(recipient, allowList)) return false;
  }

  return true;
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function evaluate(policy, call) {
  const rules = policy.rules || [];
  for (const rule of rules) {
    if (matchRule(rule, call, policy)) {
      return {
        decision: String(rule.action || 'confirm').toUpperCase(),
        ruleId: rule.id || null,
        reason: rule.reason || null
      };
    }
  }
  return { decision: 'ALLOW', ruleId: null, reason: null };
}

function main(argv) {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === '--help' || cmd === '-h') {
    console.log('Usage: tool-firewall eval --policy <policy.yaml> --input <call.json>');
    process.exit(0);
  }

  if (cmd !== 'eval') die('Unknown command: ' + cmd);

  const args = Object.fromEntries(rest.flatMap((v, i, a) => {
    if (!v.startsWith('--')) return [];
    const key = v.slice(2);
    const val = a[i + 1] && !a[i + 1].startsWith('--') ? a[i + 1] : 'true';
    return [[key, val]];
  }));

  if (!args.policy || !args.input) die('Missing --policy or --input');

  const policy = readYaml(args.policy);
  const call = readJson(args.input);

  const out = evaluate(policy, call);
  console.log(JSON.stringify(out, null, 2));
}

main(process.argv.slice(2));
