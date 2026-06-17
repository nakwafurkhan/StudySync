const GroqLib = require('groq-sdk');

// Stainless-generated SDKs export the class as both the module and `.default`.
const Groq = GroqLib.default || GroqLib;

let client = null;

/** Lazily construct the Groq client so importing this module never throws. */
function getClient() {
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

/**
 * Request a chat completion from Groq (OpenAI-compatible API) and return the
 * raw message content (string). Isolated here so the rest of the app — and the
 * tests — can mock a single function instead of the whole SDK.
 */
async function createChatCompletion(messages, options = {}) {
  const useJson = options.json !== false; // default: JSON mode (schedule/syllabus)
  const completion = await getClient().chat.completions.create({
    model: options.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages,
    ...(useJson ? { response_format: { type: 'json_object' } } : {}),
    temperature: options.temperature ?? 0.4,
  });
  return completion.choices?.[0]?.message?.content ?? '';
}

module.exports = { getClient, createChatCompletion };
