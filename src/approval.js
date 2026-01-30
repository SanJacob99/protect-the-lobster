import crypto from 'node:crypto';

export function makeApprovalId() {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Build a WhatsApp-friendly approval prompt.
 *
 * @param {{command: string, reason?: string, approvalId?: string}} args
 */
export function formatConfirmPrompt(args) {
  const approvalId = args.approvalId || makeApprovalId();
  const cmd = String(args.command || '').trim();
  const reason = args.reason ? String(args.reason).trim() : 'Policy requires confirmation.';

  const text = [
    'Security check: needs approval',
    `Command: ${cmd}`,
    `Reason: ${reason}`,
    'Reply YES to run, or NO to cancel.'
  ].join('\n');

  return { approvalId, text };
}
