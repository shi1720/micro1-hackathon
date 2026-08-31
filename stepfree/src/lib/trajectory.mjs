import { appendFileSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, basename } from 'node:path';

/**
 * Trajectory capture: every agent run is logged as JSONL (one event per line)
 * plus a human-readable Markdown rendering. These are a submission deliverable
 * — make them faithful and easy to follow.
 */

function stripImages(content) {
  if (!Array.isArray(content)) return content;
  return content.map((block) => {
    if (block?.type === 'image') return { type: 'image', note: '[image omitted from log]' };
    if (block?.type === 'tool_result' && Array.isArray(block.content)) {
      return { ...block, content: stripImages(block.content) };
    }
    return block;
  });
}

export class TrajectoryLogger {
  constructor(filePath, meta = {}) {
    this.filePath = filePath;
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, '');
    this.log('meta', { ...meta, startedAt: new Date().toISOString() });
  }

  log(kind, data) {
    appendFileSync(this.filePath, JSON.stringify({ t: new Date().toISOString(), kind, ...sanitize(data) }) + '\n');
  }

  logSdkMessage(msg) {
    if (msg.type === 'assistant' || msg.type === 'user') {
      const content = stripImages(msg.message?.content);
      this.log(msg.type, { content });
    } else if (msg.type === 'result') {
      this.log('result', {
        subtype: msg.subtype,
        turns: msg.num_turns,
        durationMs: msg.duration_ms,
        costUsd: msg.total_cost_usd,
        usage: msg.usage
          ? { input: msg.usage.input_tokens, output: msg.usage.output_tokens,
              cacheRead: msg.usage.cache_read_input_tokens, cacheWrite: msg.usage.cache_creation_input_tokens }
          : undefined,
      });
    } else if (msg.type === 'system' && msg.subtype === 'init') {
      this.log('init', { model: msg.model, tools: msg.tools });
    }
  }
}

function sanitize(data) {
  // Keep logs bounded: truncate any single string over 6000 chars.
  return JSON.parse(
    JSON.stringify(data, (k, v) =>
      typeof v === 'string' && v.length > 6000 ? v.slice(0, 6000) + `… [${v.length - 6000} chars truncated]` : v
    )
  );
}

/** Render a JSONL trajectory into readable Markdown. */
export function renderTrajectoryMarkdown(jsonlPath) {
  const lines = readFileSync(jsonlPath, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const out = [];
  const meta = lines.find((l) => l.kind === 'meta') || {};
  out.push(`# Trajectory: ${meta.agent || basename(jsonlPath)}`);
  if (meta.page) out.push(`\n**Page:** \`${meta.page}\`  `);
  if (meta.task) out.push(`**Task:** ${meta.task}  `);
  if (meta.startedAt) out.push(`**Started:** ${meta.startedAt}`);

  for (const ev of lines) {
    if (ev.kind === 'init') {
      out.push(`\n> Model: \`${ev.model}\` — available tools: ${(ev.tools || []).map((t) => `\`${t}\``).join(', ')}`);
    } else if (ev.kind === 'prompt') {
      out.push(`\n## Instructions given to the agent\n\n<details><summary>System prompt</summary>\n\n\`\`\`\n${ev.systemPrompt || ''}\n\`\`\`\n\n</details>\n\n**Task prompt:**\n\n\`\`\`\n${ev.prompt || ''}\n\`\`\``);
    } else if (ev.kind === 'assistant') {
      for (const block of ev.content || []) {
        if (block.type === 'text' && block.text?.trim()) {
          out.push(`\n**🤖 Agent:** ${block.text.trim()}`);
        } else if (block.type === 'tool_use') {
          out.push(`\n**🔧 Tool call — \`${block.name}\`**\n\`\`\`json\n${JSON.stringify(block.input, null, 2).slice(0, 2500)}\n\`\`\``);
        }
      }
    } else if (ev.kind === 'user') {
      for (const block of ev.content || []) {
        if (block.type === 'tool_result') {
          const text = Array.isArray(block.content)
            ? block.content.map((c) => (c.type === 'text' ? c.text : `[${c.type || c.note}]`)).join('\n')
            : String(block.content ?? '');
          out.push(`\n<details><summary>↩️ Tool result${block.is_error ? ' (error)' : ''}</summary>\n\n\`\`\`\n${text.slice(0, 2500)}\n\`\`\`\n\n</details>`);
        }
      }
    } else if (ev.kind === 'verification') {
      out.push(`\n**🛡️ Orchestrator verification (deterministic):** ${ev.summary}`);
    } else if (ev.kind === 'feedback') {
      out.push(`\n**🔁 Retry feedback sent to agent:** ${ev.summary}`);
    } else if (ev.kind === 'rollback') {
      out.push(`\n**⏪ ROLLBACK:** ${ev.reason}`);
    } else if (ev.kind === 'result') {
      out.push(`\n---\n**Run result:** ${ev.subtype} — ${ev.turns} turns, ${(ev.durationMs / 1000).toFixed(1)}s, $${ev.costUsd?.toFixed(4)}`);
    }
  }
  return out.join('\n');
}
