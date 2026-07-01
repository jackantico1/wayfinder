import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } from '../env';

// Thin Claude wrapper: a manual tool-use loop. We drive the loop ourselves
// (rather than a helper) so every tool call is logged — the audit trail and the
// human-in-the-loop booking gate both depend on us owning the loop.

let client: any = null;
function getClient(): any {
  if (!client) client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  return client;
}

export type ToolExecutor = (input: any) => Promise<string> | string;

/**
 * Runs the agentic loop until Claude calls `terminalTool`, then returns that
 * tool's input (the structured artifact). Throws on any failure so the caller
 * can fall back to the deterministic reasoner.
 */
export async function runToolLoop(opts: {
  system: string;
  userMessage: string;
  tools: any[];
  executors: Record<string, ToolExecutor>;
  terminalTool: string;
  maxIterations?: number;
  label: string;
}): Promise<any> {
  const { system, userMessage, tools, executors, terminalTool, label } = opts;
  const maxIterations = opts.maxIterations ?? 8;
  const messages: any[] = [{ role: 'user', content: userMessage }];

  for (let i = 0; i < maxIterations; i++) {
    const res = await getClient().messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      system,
      messages,
      tools,
    });

    const toolUses = (res.content ?? []).filter((b: any) => b.type === 'tool_use');
    if (toolUses.length === 0) {
      throw new Error(`[${label}] model ended without calling ${terminalTool}`);
    }

    const terminal = toolUses.find((t: any) => t.name === terminalTool);
    if (terminal) {
      console.log(`[agent:${label}] submit via ${terminalTool}`);
      return terminal.input;
    }

    // Echo the assistant turn (incl. thinking + tool_use blocks) back verbatim.
    messages.push({ role: 'assistant', content: res.content });

    const results: any[] = [];
    for (const t of toolUses) {
      console.log(`[agent:${label}] tool: ${t.name} ${JSON.stringify(t.input)}`);
      const exec = executors[t.name];
      const out = exec ? await exec(t.input) : `Error: unknown tool ${t.name}`;
      results.push({ type: 'tool_result', tool_use_id: t.id, content: out });
    }
    messages.push({ role: 'user', content: results });
  }

  throw new Error(`[${label}] exceeded ${maxIterations} iterations without submitting`);
}
