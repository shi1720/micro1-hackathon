import { query } from '@anthropic-ai/claude-agent-sdk';
import { resolve } from 'node:path';
import { TrajectoryLogger } from '../lib/trajectory.mjs';

/**
 * Thin harness over the Claude Agent SDK:
 *  - every run is sandboxed to its working copy (canUseTool path guard)
 *  - no shell, no network — file tools + StepFree's own MCP tools only
 *  - every message is captured to a trajectory log
 */

const FILE_TOOLS = new Set(['Read', 'Write', 'Edit', 'MultiEdit', 'Glob', 'Grep', 'NotebookEdit']);

function makePathGuard(workdir) {
  const root = resolve(workdir);
  return async (toolName, input) => {
    if (toolName.startsWith('mcp__stepfree__')) return { behavior: 'allow', updatedInput: input };
    if (FILE_TOOLS.has(toolName)) {
      const p = input.file_path || input.path || input.notebook_path;
      if (!p) return { behavior: 'allow', updatedInput: input }; // Glob/Grep default to cwd
      const abs = resolve(root, p);
      if (abs === root || abs.startsWith(root + '/')) return { behavior: 'allow', updatedInput: input };
      return {
        behavior: 'deny',
        message: `Denied: ${p} is outside the working copy. This agent may only touch files under ${root}.`,
      };
    }
    return { behavior: 'deny', message: `Tool ${toolName} is not permitted for this agent.` };
  };
}

export const DEFAULT_MODEL = process.env.STEPFREE_MODEL || 'claude-sonnet-5';

/**
 * Run one agent to completion.
 * Returns { success, text, costUsd, turns, durationMs }.
 */
export async function runAgent({
  name,
  task,
  page,
  systemPrompt,
  prompt,
  workdir,
  mcpServer,
  mcpToolNames = [],
  fileTools = ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
  model = DEFAULT_MODEL,
  maxTurns = 60,
  timeoutMs = 15 * 60 * 1000,
  trajectoryPath,
}) {
  const logger = trajectoryPath ? new TrajectoryLogger(trajectoryPath, { agent: name, task, page }) : null;
  logger?.log('prompt', { systemPrompt, prompt });

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(new Error(`agent ${name} timed out`)), timeoutMs);

  const allowedTools = [...fileTools, ...mcpToolNames.map((t) => `mcp__stepfree__${t}`)];

  const startedAt = Date.now();
  let resultMsg = null;
  let lastText = '';

  try {
    const q = query({
      prompt,
      options: {
        model,
        cwd: workdir,
        maxTurns,
        abortController: abort,
        systemPrompt,
        settingSources: [],
        allowedTools,
        disallowedTools: ['Bash', 'WebFetch', 'WebSearch', 'Task', 'TodoWrite', 'KillShell', 'BashOutput'],
        mcpServers: mcpServer ? { stepfree: mcpServer } : undefined,
        canUseTool: makePathGuard(workdir),
      },
    });

    for await (const msg of q) {
      logger?.logSdkMessage(msg);
      if (msg.type === 'assistant') {
        for (const block of msg.message?.content || []) {
          if (block.type === 'text') lastText = block.text;
        }
      }
      if (msg.type === 'result') resultMsg = msg;
    }
  } finally {
    clearTimeout(timer);
  }

  return {
    success: resultMsg?.subtype === 'success',
    text: resultMsg?.result ?? lastText,
    costUsd: resultMsg?.total_cost_usd ?? 0,
    turns: resultMsg?.num_turns ?? 0,
    durationMs: Date.now() - startedAt,
    logger,
  };
}
