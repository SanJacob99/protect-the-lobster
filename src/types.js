// Minimal tool-call shape used by protect-the-lobster.
// This mirrors Clawdbot's tool call intent at a high level.

/**
 * @typedef {{
 *   tool: string,
 *   input: Record<string, any>
 * }} ToolCall
 */

export const ToolCall = {};
