import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { z } from 'zod';

/**
 * Thin wrapper around the Anthropic Messages API that always returns
 * validated JSON. Only ever imported from server code.
 */

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured on the server.');
  }
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';

function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new Error('The AI response did not contain a JSON object.');
  }
  return JSON.parse(text.slice(start, end + 1));
}

type AskArgs<T> = {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
};

/**
 * Ask Claude for JSON matching `schema`. If the first reply fails validation,
 * one repair attempt is made by showing the validation errors back to the model.
 */
export async function askClaudeJson<T>({
  system,
  user,
  schema,
  maxTokens = 4000,
}: AskArgs<T>): Promise<{ data: T; model: string }> {
  const send = async (content: string) => {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: [
        // Cache the (large, constant) system prompt to cut cost on repeat runs.
        { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return extractJson(text);
  };

  const first = schema.safeParse(await send(user));
  if (first.success) return { data: first.data, model: MODEL };

  const issues = first.error.issues
    .slice(0, 5)
    .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
    .join('; ');

  const repaired = schema.safeParse(
    await send(
      `${user}\n\nYour previous reply did not match the required JSON schema (${issues}). ` +
        'Reply again with only one valid JSON object that matches the schema exactly.'
    )
  );

  if (!repaired.success) {
    throw new Error('The AI response could not be validated. Please try again.');
  }
  return { data: repaired.data, model: MODEL };
}
