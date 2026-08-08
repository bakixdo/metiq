import { classifyTokensWithAI, generateAISignals } from '@/lib/classification/ai';

describe('Unified AI Cascade Integration Tests', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, GROQ_API_KEY: 'gsk_mock_api_key_for_testing' };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  test('classifyTokensWithAI correctly requests and parses model output mappings from the active provider', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              classifications: [
                { address: '0x123456789', narrative: 'AI Agents' },
                { address: '0xabcdef', narrative: 'DePIN' }
              ]
            })
          }
        }
      ]
    };

    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    ) as any;

    const tokens = [
      { address: '0x123456789', symbol: 'ELIZA', name: 'Eliza Agent', description: 'Autonomous agent framework.' },
      { address: '0xabcdef', symbol: 'HNT', name: 'Helium Network', description: 'DePIN wireless.' }
    ];

    const result = await classifyTokensWithAI(tokens);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.classifications['0x123456789']).toBe('AI Agents');
    expect(result.classifications['0xabcdef']).toBe('DePIN');
    expect(result.provider).toBe('Groq');
  });

  test('generateAISignals requests and returns batch signals map object', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              'AI Compute': 'Volume surges as GPU rendering networks expand.',
              'DePIN': 'Activity rises as hardware hotspots increase pools.'
            })
          }
        }
      ]
    };

    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    ) as any;

    const signals = await generateAISignals([
      { name: 'AI Compute', leaders: ['$NOS'], volume: 450000, liquidity: 120000, coins: 3 },
      { name: 'DePIN', leaders: ['$HNT'], volume: 150000, liquidity: 50000, coins: 2 }
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(signals['AI Compute']).toBe('Volume surges as GPU rendering networks expand.');
    expect(signals['DePIN']).toBe('Activity rises as hardware hotspots increase pools.');
  });

  test('Returns empty object silently if AI signal batch generation fails', async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.reject(new Error('Rate limit exceeded'))
    ) as any;

    const signals = await generateAISignals([
      { name: 'AI Compute', leaders: ['$NOS'], volume: 450000, liquidity: 120000, coins: 3 }
    ]);

    expect(signals).toEqual({});
  });
});
