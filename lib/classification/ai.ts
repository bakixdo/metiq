import { getEnv } from '../config/env';

export interface AIProvider {
  name: string;
  isEnabled: () => boolean;
  classify: (tokens: Array<{ address: string; symbol: string; name: string; description: string }>) => Promise<Record<string, string>>;
  generateSignal: (narrative: string, leaders: string[], metrics: { volume: number; liquidity: number; coins: number }) => Promise<string>;
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
    description: t.description.substring(0, 180),
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
- 'address': string (the input token address in lowercase)
- 'narrative': string (one of the exact categories listed above)

Strictly follow categories. Do not include explanations, code blocks, or markdown.`;

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
      max_tokens: 2000,
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

async function generateSignalWithGroq(
  narrative: string,
  leaders: string[],
  metrics: { volume: number; liquidity: number; coins: number }
): Promise<string> {
  const env = getEnv();
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) return '';

  const prompt = `Generate a single short sentence (max 15 words) describing the market momentum signal for the crypto narrative '${narrative}'.
Metrics:
- Leaders: ${leaders.join(', ')}
- 6H Volume: $${(metrics.volume / 1000).toFixed(0)}K
- Pool Liquidity: $${(metrics.liquidity / 1000).toFixed(0)}K
- Active Coins: ${metrics.coins}

Write a direct, professional signal sentence. Do not output quote marks or explanations.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 60,
    }),
  });

  if (!response.ok) return '';
  const resJson = await response.json();
  const signal = resJson.choices?.[0]?.message?.content?.trim();
  return signal ? signal.replace(/["']/g, '') : '';
}

// --- Provider Registry ---
export const AI_PROVIDERS: AIProvider[] = [
  {
    name: 'Groq',
    isEnabled: () => !!getEnv().GROQ_API_KEY,
    classify: classifyWithGroq,
    generateSignal: generateSignalWithGroq,
  },
  // Future AI providers (e.g. Gemini, OpenAI) can be added here
];

/**
 * Classifies tokens using the first enabled AI provider in our cascade.
 * Falls back to the next provider if one fails.
 */
export async function classifyTokensWithAI(
  tokens: Array<{ address: string; symbol: string; name: string; description: string }>
): Promise<Record<string, string>> {
  for (const provider of AI_PROVIDERS) {
    if (provider.isEnabled()) {
      try {
        console.log(`🤖 Requesting AI classifications from: ${provider.name}`);
        return await provider.classify(tokens);
      } catch (err: any) {
        console.warn(`⚠️ AI Provider ${provider.name} failed:`, err.message);
        // Continue to the next enabled provider
      }
    }
  }
  return {}; // Return empty if no AI was enabled or all failed
}

/**
 * Generates narrative signals using the first enabled AI provider in our cascade.
 */
export async function generateAISignal(
  narrative: string,
  leaders: string[],
  metrics: { volume: number; liquidity: number; coins: number }
): Promise<string> {
  for (const provider of AI_PROVIDERS) {
    if (provider.isEnabled()) {
      try {
        const signal = await provider.generateSignal(narrative, leaders, metrics);
        if (signal) return signal;
      } catch (err: any) {
        console.warn(`⚠️ AI Signal generation failed on ${provider.name}:`, err.message);
      }
    }
  }
  return '';
}
