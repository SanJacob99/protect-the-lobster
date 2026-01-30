// Helpers to represent actions as ToolCall JSON.

export function execToToolCall(command, opts = {}) {
  if (typeof command !== 'string' || !command.trim()) {
    throw new Error('execToToolCall: command must be a non-empty string');
  }
  return {
    tool: 'exec',
    input: {
      command,
      ...opts
    }
  };
}
