import { scoreNarratives } from '@/lib/scoring/engine';
import { DexScreenerToken } from '@/lib/collectors/dexscreener';

describe('Scoring and Penalty Engine Tests', () => {
  const getMockToken = (overrides: Partial<DexScreenerToken> = {}): DexScreenerToken => {
    return {
      chain: 'solana',
      address: '0x123456789',
      symbol: 'TEST',
      name: 'Test Token',
      price: 1.0,
      marketCap: 1000000,
      liquidity: 100000,
      volume_1h: 15000,
      volume_6h: 90000,
      buys_1h: 200,
      sells_1h: 150,
      price_change_1h: 1.5,
      price_change_6h: 10.0,
      pair_created_at: Date.now() - 3600 * 1000, // 1h ago (fresh launch)
      pair_url: 'https://dexscreener.com/solana/0x123456789',
      description: 'Useful crypto project description with metadata.',
      websites: ['https://test.com'],
      socials: ['https://x.com/test'],
      isBoosted: false,
      narrative: 'AI Agents',
      ...overrides,
    };
  };

  test('Successfully scores AI Agents narrative', () => {
    const tokens = [
      getMockToken({ symbol: 'A1', narrative: 'AI Agents', volume_6h: 100000, liquidity: 50000 }),
      getMockToken({ symbol: 'A2', address: '0xabc', narrative: 'AI Agents', volume_6h: 50000, liquidity: 30000 }),
    ];

    const scored = scoreNarratives(tokens);
    const aiAgents = scored.find(n => n.name === 'AI Agents');

    expect(aiAgents).toBeDefined();
    expect(aiAgents!.score).toBeGreaterThan(0);
    expect(aiAgents!.score).toBeLessThanOrEqual(100);
    expect(aiAgents!.coin_count).toBe(2);
    expect(aiAgents!.leaders.map(l => l.symbol)).toContain('A1');
    expect(aiAgents!.leaders.map(l => l.symbol)).toContain('A2');
  });

  test('Applies concentration penalty when narrative depends on a single token', () => {
    // 2 tokens: one has 99% of narrative volume
    const tokens = [
      getMockToken({ symbol: 'DOM', narrative: 'AI Agents', volume_6h: 990000, liquidity: 100000 }),
      getMockToken({ symbol: 'MIN', address: '0xabc', narrative: 'AI Agents', volume_6h: 1000, liquidity: 10000 }),
    ];

    const scored = scoreNarratives(tokens);
    const aiAgents = scored.find(n => n.name === 'AI Agents');

    expect(aiAgents).toBeDefined();
    expect(aiAgents!.warnings.some(w => w.includes('depends heavily on one coin'))).toBe(true);
  });

  test('Applies penalty for extremely low liquidity', () => {
    const tokens = [
      getMockToken({ symbol: 'LOW', narrative: 'AI Agents', volume_6h: 5000, liquidity: 2000 }),
    ];

    const scored = scoreNarratives(tokens);
    const aiAgents = scored.find(n => n.name === 'AI Agents');

    expect(aiAgents).toBeDefined();
    expect(aiAgents!.warnings).toContain('Extremely low liquidity. High risk of slippage.');
  });

  test('Calculates narrative score changes relative to previous snapshots', () => {
    const tokens = [
      getMockToken({ symbol: 'T1', narrative: 'AI Agents', volume_6h: 100000, liquidity: 50000 }),
    ];

    // Previous scan records AI Agents with score of 30
    const prevSnapshots = {
      'AI Agents': {
        score: 30,
        volume_6h: 80000,
        liquidity: 40000,
        coin_count: 1,
      },
    };

    const scored = scoreNarratives(tokens, prevSnapshots);
    const aiAgents = scored.find(n => n.name === 'AI Agents');

    expect(aiAgents).toBeDefined();
    // Delta should be calculated: current - previous
    expect(aiAgents!.score_change).toBe(aiAgents!.score - 30);
  });
});
