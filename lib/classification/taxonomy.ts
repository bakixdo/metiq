export const NARRATIVES = [
  'AI Agents',
  'AI Compute',
  'DePIN',
  'RWA',
  'Stocks',
  'Payments and PayFi',
  'Privacy',
  'Robotics',
  'Prediction Markets',
  'Gaming',
  'Animal Memes',
  'Political Memes',
  'Culture Memes',
  'Other'
] as const;

export type NarrativeType = typeof NARRATIVES[number];

export interface TaxonomyEntry {
  name: NarrativeType;
  keywords: string[]; // lowercase keywords or phrases
  symbolKeywords?: string[]; // specific keywords for matching token symbol
}

export const TAXONOMY: TaxonomyEntry[] = [
  {
    name: 'AI Agents',
    keywords: ['agent', 'ai agent', 'agentic', 'autonomous', 'bot', 'virtual', 'eliza', 'ai16z', 'npc', 'ai-agent', 'ai_agent', 'fartcaster', 'terminal of truth', 'truth terminal', 'vvaifu', 'spectra', 'synesis'],
    symbolKeywords: ['agent', 'virtual', 'eliza', 'npc', 'vvaifu', 'bot']
  },
  {
    name: 'AI Compute',
    keywords: ['compute', 'gpu', 'cpu', 'render', 'akash', 'ai compute', 'nosana', 'io.net', 'processing', 'grid', 'node', 'decentralized compute', 'clore', 'octa', 'render network'],
    symbolKeywords: ['gpu', 'akt', 'nos', 'io', 'render', 'clore']
  },
  {
    name: 'DePIN',
    keywords: ['depin', 'physical infrastructure', 'network', 'wifi', 'storage', 'helium', 'filecoin', 'hivemapper', 'hotspot', 'bandwidth', 'node', 'sensor', 'maps', 'telecom', 'shdw', 'arweave'],
    symbolKeywords: ['depin', 'hnt', 'fil', 'shdw', 'ar']
  },
  {
    name: 'RWA',
    keywords: ['rwa', 'real world asset', 'tokenized', 'treasury', 'bond', 'real estate', 'gold', 'commodity', 'yield', 'backing', 'property', 'ondo', 'centrifuge', 'clearpool', 'landshare'],
    symbolKeywords: ['rwa', 'ondo', 'cfg', 'cpool']
  },
  {
    name: 'Stocks',
    keywords: ['gme', 'amc', 'stock', 'wallstreet', 'wsb', 'roaring kitty', 'roaringkitty', 'stonk', 'gamestop', 'option', 'equity', 'keith gill', 'shares', 'market index'],
    symbolKeywords: ['gme', 'amc', 'wsb', 'stonk', 'kitty']
  },
  {
    name: 'Payments and PayFi',
    keywords: ['pay', 'payment', 'payfi', 'transaction', 'card', 'checkout', 'merchant', 'remittance', 'finance', 'stripe', 'solpay', 'transfer', 'credit', 'debit', 'pos', 'billing'],
    symbolKeywords: ['pay', 'payfi', 'card']
  },
  {
    name: 'Privacy',
    keywords: ['privacy', 'anonymous', 'shield', 'secret', 'private', 'zkp', 'zero knowledge', 'tornado', 'mixer', 'stealth', 'zk-proof', 'confidential', 'obscure', 'monero'],
    symbolKeywords: ['priv', 'scrrt', 'zkp', 'xmr']
  },
  {
    name: 'Robotics',
    keywords: ['robot', 'robotic', 'drone', 'automation', 'cybernetic', 'mecha', 'android', 'boston dynamics', 'optimus', 'humanoid', 'cyborg', 'machine', 'quadruped'],
    symbolKeywords: ['robot', 'bot', 'drone', 'mecha']
  },
  {
    name: 'Prediction Markets',
    keywords: ['predict', 'polymarket', 'bet', 'betting', 'prediction', 'election', 'forecasting', 'odds', 'gamble', 'wager', 'speculate', 'binary option', 'bookmaker'],
    symbolKeywords: ['bet', 'predict', 'poly']
  },
  {
    name: 'Gaming',
    keywords: ['game', 'gaming', 'play', 'p2e', 'play-to-earn', 'arcade', 'rpg', 'metaverse', 'steam', 'epic games', 'gamefi', 'console', 'gamer', 'nft game', 'guild', 'esports', 'pixel'],
    symbolKeywords: ['game', 'play', 'gfi', 'pixel']
  },
  {
    name: 'Animal Memes',
    keywords: ['dog', 'cat', 'frog', 'pepe', 'doge', 'shib', 'wif', 'bonk', 'catgirl', 'popcat', 'mew', 'floki', 'neiro', 'goat', 'animal', 'pet', 'puppy', 'kitten', 'moodeng', 'hippo', 'squirrel', 'pnut'],
    symbolKeywords: ['pepe', 'doge', 'shib', 'wif', 'bonk', 'popcat', 'mew', 'floki', 'neiro', 'goat', 'pnut']
  },
  {
    name: 'Political Memes',
    keywords: ['trump', 'biden', 'kamala', 'harris', 'maga', 'political', 'election', 'democrat', 'republican', 'politifi', 'president', 'vote', 'constitution', 'patriot', 'whitehouse', 'obama'],
    symbolKeywords: ['trump', 'biden', 'maga', 'kamala', 'harris', 'vote']
  },
  {
    name: 'Culture Memes',
    keywords: ['spit', 'hawk', 'tuah', 'culture', 'chill guy', 'chillguy', 'wojak', 'chad', 'giga', 'viral', 'tiktok', 'youtube', 'meme', 'mood', 'vibe', 'brainrot', 'elmo', 'gigachad', 'soyjack'],
    symbolKeywords: ['chill', 'wojak', 'chad', 'meme']
  }
];

// Helper to escape special regex characters
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Classifies a token into a narrative based on weighted keyword matching.
 * 
 * Weights:
 * - Symbol match: 5.0 (exact match) / 3.0 (word boundary match)
 * - Name match: 3.0 (word match) / 1.0 (substring match)
 * - Description match: 1.5 (word match) / 0.5 (substring match)
 * 
 * If no narrative scores >= 1.0, falls back to "Other".
 */
export function classifyToken(token: {
  name: string;
  symbol: string;
  description: string;
}): NarrativeType {
  const name = token.name.toLowerCase();
  const symbol = token.symbol.replace('$', '').toLowerCase();
  const desc = token.description.toLowerCase();

  let bestNarrative: NarrativeType = 'Other';
  let highestScore = 0;

  for (const entry of TAXONOMY) {
    let score = 0;

    // 1. Symbol Match
    const symbolKeywords = entry.symbolKeywords || [];
    // Exact symbol match is a very strong signal
    if (symbolKeywords.includes(symbol)) {
      score += 5.0;
    } else {
      // Check if any taxonomy keyword matches the symbol
      for (const kw of entry.keywords) {
        if (symbol === kw) {
          score += 4.5;
          break;
        } else if (symbol.includes(kw) && kw.length >= 3) {
          score += 2.0;
        }
      }
    }

    // 2. Name Match
    for (const kw of entry.keywords) {
      const escaped = escapeRegExp(kw);
      const wordRegex = new RegExp(`\\b${escaped}\\b`, 'i');
      
      if (wordRegex.test(name)) {
        score += 3.0;
      } else if (name.includes(kw)) {
        score += 1.0;
      }
    }

    // 3. Description Match
    for (const kw of entry.keywords) {
      const escaped = escapeRegExp(kw);
      const wordRegex = new RegExp(`\\b${escaped}\\b`, 'i');

      if (wordRegex.test(desc)) {
        score += 1.5;
      } else if (desc.includes(kw)) {
        score += 0.5;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestNarrative = entry.name;
    }
  }

  // Define threshold for classification; otherwise fallback to Other
  if (highestScore < 1.0) {
    return 'Other';
  }

  return bestNarrative;
}
