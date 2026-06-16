const OpenAI = require('openai');

let client = null;

/** Lazily construct the OpenAI client so importing this module never throws. */
function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

/**
 * Request a chat completion and return the raw message content (string).
 * Isolated here so the rest of the app — and the tests — can mock a single
 * function instead of the whole SDK.
 */
async function createChatCompletion(messages, options = {}) {
  const completion = await getClient().chat.completions.create({
    model: options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    response_format: { type: 'json_object' },
    temperature: options.temperature ?? 0.4,
  });
  return completion.choices?.[0]?.message?.content ?? '';
}

module.exports = { getClient, createChatCompletion };
