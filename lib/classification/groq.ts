import { getEnv } from '../config/env';

/**
 * Classifies a batch of tokens using Groq's Llama-3.1 model.
 * Returns a mapping of token address/symbol -> narrative.
 * 
 * In case of rate limits, timeouts, or API errors, it throws an error so the caller can fall back.
 */
export async function classifyTokensWithGroq(
  tokens: Array<{ address: string; symbol: string; name: string; description: string }>
): Promise<Record<string, string>> {
  const env = getEnv();
  const apiKey = env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('Groq API Key is not configured.');
  }

  // Format token data compact for the prompt
  const compactTokens = tokens.map(t => ({
    address: t.address.toLowerCase(),
    symbol: t.symbol.toUpperCase(),
    name: t.name,
    description: t.description.substring(0, 180), // limit length to save context
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
    throw new Error(`Groq API Error: HTTP ${response.status} ${response.statusText}`);
  }

  const resJson = await response.json();
  const replyContent = resJson.choices?.[0]?.message?.content;
  if (!replyContent) {
    throw new Error('Groq returned an empty response.');
  }

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

/**
 * Generates a dynamic market signal sentence (max 15 words) for a narrative.
 */
export async function generateNarrativeSignal(
  narrative: string,
  leaders: string[],
  metrics: { volume: number; liquidity: number; coins: number }
): Promise<string> {
  const env = getEnv();
  const apiKey = env.GROQ_API_KEY;

  if (!apiKey) {
    return ''; // Return empty string so formatter defaults to static signals
  }

  const prompt = `Generate a single short sentence (max 15 words) describing the market momentum signal for the crypto narrative '${narrative}'.
Metrics:
- Leaders: ${leaders.join(', ')}
- 6H Volume: $${(metrics.volume / 1000).toFixed(0)}K
- Pool Liquidity: $${(metrics.liquidity / 1000).toFixed(0)}K
- Active Coins: ${metrics.coins}

Write a direct, professional signal sentence (e.g. 'Volume is surging as compute networks lead active accumulation' or 'Breadth expands as animal memecoins rally on high liquidity'). Do not output quote marks, greetings, or explanations.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 60,
      }),
    });

    if (!response.ok) return '';

    const resJson = await response.json();
    const signal = resJson.choices?.[0]?.message?.content?.trim();
    return signal ? signal.replace(/["']/g, '') : '';
  } catch {
    return ''; // Fail silently to maintain fallback rendering
  }
}
