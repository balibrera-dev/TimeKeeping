/**
 * AI settings live under their own localStorage key, separate from the app
 * data, so the API key never ends up in exports or cross-tab state syncs.
 */
const AI_KEY = 'balisoft-timekeeping:ai';

export const AI_MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 (best quality)' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (faster)' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5 (fastest, cheapest)' },
];

export const DEFAULT_AI_SETTINGS = { apiKey: '', model: 'claude-opus-5-5' };

export function loadAiSettings() {
  try {
    const raw = localStorage.getItem(AI_KEY);
    return raw ? { ...DEFAULT_AI_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_AI_SETTINGS };
  } catch {
    return { ...DEFAULT_AI_SETTINGS };
  }
}

export function saveAiSettings(settings) {
  try {
    localStorage.setItem(AI_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Could not save AI settings.', err);
  }
}

const SYSTEM = `You rewrite short work-log comments for BALISOFT, a software and business-intelligence consultancy.
Make the comment clear, concise and professional so a teammate or client can understand it at a glance.
Keep every fact, name, number, date, link, ticket ID and timestamp prefix like "[Oct 14, 09:30]" exactly as written. Do not invent details.
Fix spelling and grammar. Keep the author's language (reply in Spanish if the comment is in Spanish).
Use short sentences or "- " bullets when there are several points. No headings, no markdown emphasis.
Reply with only the improved comment text.`;

/** Server-side refusal fallback is supported on Opus 5.5 and Sonnet 5.5, not Haiku. */
const SUPPORTS_FALLBACKS = new Set(['claude-opus-5-5', 'claude-sonnet-5-5']);

/**
 * Ask Claude to polish a subtask / task comment.
 * @param {{ text: string, task: string, subtask?: string, client?: string }} input
 * @returns {Promise<string>}
 */
export async function improveComment({ text, task, subtask, client }) {
  const { apiKey, model } = loadAiSettings();
  if (!apiKey) throw new Error('Add your Anthropic API key in Settings (gear icon) to use AI.');

  // Loaded on first use so the SDK stays out of the main bundle. The app runs
  // only on the user's own localhost, with their own key.
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const context = [client && `Client: ${client}`, `Task: ${task}`, subtask && `Subtask: ${subtask}`].filter(Boolean).join('\n');

  const params = {
    model,
    max_tokens: 4000,
    system: SYSTEM,
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: `${context}\n\n<comment>\n${text}\n</comment>` }],
  };

  let response;
  try {
    response = SUPPORTS_FALLBACKS.has(model)
      ? await anthropic.beta.messages.create({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' })
      : await anthropic.messages.create(params);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new Error('The API key was rejected. Check it in Settings.');
    if (err instanceof Anthropic.RateLimitError) throw new Error('Rate limited by the API. Try again in a moment.');
    if (err instanceof Anthropic.APIConnectionError) throw new Error('Could not reach the Anthropic API. Check your connection.');
    if (err instanceof Anthropic.APIError) throw new Error(err.message || 'The AI request failed.');
    throw err;
  }

  if (response.stop_reason === 'refusal') throw new Error('The model declined to rewrite this comment.');
  const out = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
  if (!out) throw new Error('The model returned an empty response.');
  return out;
}
