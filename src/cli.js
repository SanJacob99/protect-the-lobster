#!/usr/bin/env node

import fs from 'node:fs';
import { execToToolCall } from './serialize.js';
import { evaluate, loadPolicyYaml } from './eval.js';
import { formatConfirmPrompt } from './approval.js';

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function parseArgs(rest) {
  return Object.fromEntries(
    rest.flatMap((v, i, a) => {
      if (!v.startsWith('--')) return [];
      const key = v.slice(2);
      const val = a[i + 1] && !a[i + 1].startsWith('--') ? a[i + 1] : 'true';
      return [[key, val]];
    })
  );
}

function usage() {
  console.log(`Usage:
  node src/cli.js eval --policy <policy.yaml> --input <call.json>
  node src/cli.js exec-to-json --command "<cmd>" [--out <path>]
  node src/cli.js format-confirm --command "<cmd>" --reason "<why>" [--approval-id <id>]
`);
}

function main(argv) {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === '--help' || cmd === '-h') {
    usage();
    process.exit(0);
  }

  const args = parseArgs(rest);

  if (cmd === 'exec-to-json') {
    if (!args.command) die('Missing --command');
    const call = execToToolCall(args.command);
    const out = JSON.stringify(call, null, 2);
    if (args.out) fs.writeFileSync(args.out, out + '\n');
    else console.log(out);
    return;
  }

  if (cmd === 'eval') {
    if (!args.policy || !args.input) die('Missing --policy or --input');
    const policy = loadPolicyYaml(args.policy);
    const call = readJson(args.input);
    const out = evaluate(policy, call);
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  if (cmd === 'format-confirm') {
    if (!args.command) die('Missing --command');
    const prompt = formatConfirmPrompt({
      command: args.command,
      reason: args.reason,
      approvalId: args['approval-id']
    });
    console.log(JSON.stringify(prompt, null, 2));
    return;
  }

  die('Unknown command: ' + cmd);
}

main(process.argv.slice(2));
