import { getEnv } from '../config/env';

export interface AIProvider {
  name: string;
  isEnabled: () => boolean;
  classify: (tokens: Array<{ address: string; symbol: string; name: string; description: string }>) => Promise<Record<string, string>>;
  generateSignals: (
    narratives: Array<{ name: string; leaders: string[]; volume: number; liquidity: number; coins: number }>
  ) => Promise<Record<string, string>>;
}

// --- Grok (xAI) Provider Implementation ---
async function classifyWithGrok(
  tokens: Array<{ address: string; symbol: string; name: string; description: string }>
): Promise<Record<string, string>> {
  const env = getEnv();
  const apiKey = env.GROK_API_KEY;
  if (!apiKey) throw new Error('Grok API Key is not set.');

  const compactTokens = tokens.map(t => ({
    address: t.address.toLowerCase(),
    symbol: t.symbol.toUpperCase(),
    name: t.name,
    description: t.description ? t.description.substring(0, 120) : '',
  }));

  const systemPrompt = `You are a crypto narrative classifier. Classify each input token into exactly one of these narratives:
- AI Agents
- AI Compute
- DePIN
- RWA
- Stocks
- Payments and PayFi
- Privacy
- Robotics
- Prediction Markets
- Gaming
- Animal Memes
- Political Memes
- Culture Memes
- Other

Output a JSON object with a single root key 'classifications' containing an array of objects. Each object must have:
- 'address': string (lowercase)
- 'narrative': string (exact name)

Strictly follow categories. Do not include markdown, explanations, or code blocks.`;

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-4.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(compactTokens) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Grok HTTP Error: ${response.status}`);
  }

  const resJson = await response.json();
  const replyContent = resJson.choices?.[0]?.message?.content;
  if (!replyContent) throw new Error('Empty response from Grok.');

  const parsed = JSON.parse(replyContent);
  const mappings: Record<string, string> = {};

  if (Array.isArray(parsed.classifications)) {
    parsed.classifications.forEach((c: any) => {
      if (c.address && c.narrative) {
        mappings[c.address.toLowerCase()] = c.narrative;
      }
    });
  }

  return mappings;
}

async function generateSignalsWithGrok(
  narratives: Array<{ name: string; leaders: string[]; volume: number; liquidity: number; coins: number }>
): Promise<Record<string, string>> {
  const env = getEnv();
  const apiKey = env.GROK_API_KEY;
  if (!apiKey) return {};

  const systemPrompt = `You are a financial trend analyst. For each crypto narrative in the input JSON, write a single-sentence momentum signal (max 12 words) describing its trend.
Return a JSON object where the keys are narrative names and the values are signal strings.
Example output format:
{
  "AI Compute": "Volume surges as decentralized GPU rendering projects expand."
}
Keep signals short, direct, and professional. Do not write markdown or code blocks.`;

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-4.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(narratives) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  if (!response.ok) throw new Error(`Grok HTTP Error: ${response.status}`);
  const resJson = await response.json();
  const replyContent = resJson.choices?.[0]?.message?.content;
  if (!replyContent) return {};

  return JSON.parse(replyContent);
}

// --- Groq Provider Implementation ---
async function classifyWithGroq(
  tokens: Array<{ address: string; symbol: string; name: string; description: string }>
): Promise<Record<string, string>> {
  const env = getEnv();
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Groq API Key is not set.');

  const compactTokens = tokens.map(t => ({
    address: t.address.toLowerCase(),
    symbol: t.symbol.toUpperCase(),
    name: t.name,
    description: t.description ? t.description.substring(0, 120) : '',
  }));

  const systemPrompt = `You are a crypto narrative classifier. Classify each input token into exactly one of these narratives:
- AI Agents
- AI Compute
- DePIN
- RWA
- Stocks
- Payments and PayFi
- Privacy
- Robotics
- Prediction Markets
- Gaming
- Animal Memes
- Political Memes
- Culture Memes
- Other

Output a JSON object with a single root key 'classifications' containing an array of objects. Each object must have:
- 'address': string (lowercase)
- 'narrative': string (exact name)

Strictly follow categories. Do not include markdown, explanations, or code blocks.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(compactTokens) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq HTTP Error: ${response.status}`);
  }

  const resJson = await response.json();
  const replyContent = resJson.choices?.[0]?.message?.content;
  if (!replyContent) throw new Error('Empty response from Groq.');

  const parsed = JSON.parse(replyContent);
  const mappings: Record<string, string> = {};

  if (Array.isArray(parsed.classifications)) {
    parsed.classifications.forEach((c: any) => {
      if (c.address && c.narrative) {
        mappings[c.address.toLowerCase()] = c.narrative;
      }
    });
  }

  return mappings;
}

async function generateSignalsWithGroq(
  narratives: Array<{ name: string; leaders: string[]; volume: number; liquidity: number; coins: number }>
): Promise<Record<string, string>> {
  const env = getEnv();
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) return {};

  const systemPrompt = `You are a financial trend analyst. For each crypto narrative in the input JSON, write a single-sentence momentum signal (max 12 words) describing its trend.
Return a JSON object where the keys are narrative names and the values are signal strings.
Example output format:
{
  "AI Compute": "Volume surges as decentralized GPU rendering projects expand."
}
Keep signals short, direct, and professional. Do not write markdown or code blocks.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(narratives) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 600,
    }),
  });

  if (!response.ok) throw new Error(`Groq HTTP Error: ${response.status}`);
  const resJson = await response.json();
  const replyContent = resJson.choices?.[0]?.message?.content;
  if (!replyContent) return {};

  return JSON.parse(replyContent);
}

// --- Provider Registry ---
export const AI_PROVIDERS: AIProvider[] = [
  {
    name: 'Grok',
    isEnabled: () => !!getEnv().GROK_API_KEY,
    classify: classifyWithGrok,
    generateSignals: generateSignalsWithGrok,
  },
  {
    name: 'Groq',
    isEnabled: () => !!getEnv().GROQ_API_KEY,
    classify: classifyWithGroq,
    generateSignals: generateSignalsWithGroq,
  },
];

/**
 * Classifies tokens using the first enabled AI provider.
 */
export async function classifyTokensWithAI(
  tokens: Array<{ address: string; symbol: string; name: string; description: string }>
): Promise<{ classifications: Record<string, string>; provider: string | null }> {
  for (const provider of AI_PROVIDERS) {
    if (provider.isEnabled()) {
      try {
        console.log(`🤖 Requesting AI classifications from: ${provider.name}`);
        const classifications = await provider.classify(tokens);
        return { classifications, provider: provider.name };
      } catch (err: any) {
        console.warn(`⚠️ AI Provider ${provider.name} failed:`, err.message);
      }
    }
  }
  return { classifications: {}, provider: null };
}

/**
 * Generates all narrative signals in a single API call.
 */
export async function generateAISignals(
  narratives: Array<{ name: string; leaders: string[]; volume: number; liquidity: number; coins: number }>
): Promise<Record<string, string>> {
  for (const provider of AI_PROVIDERS) {
    if (provider.isEnabled()) {
      try {
        console.log(`🤖 Generating dynamic signals via: ${provider.name}`);
        return await provider.generateSignals(narratives);
      } catch (err: any) {
        console.warn(`⚠️ AI Signal generation failed on ${provider.name}:`, err.message);
      }
    }
  }
  return {};
}
