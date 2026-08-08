import { classifyTokensWithGroq, generateNarrativeSignal } from '@/lib/classification/groq';

describe('Groq API Integration Tests', () => {
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

  test('classifyTokensWithGroq correctly requests and parses model output mappings', async () => {
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

    const result = await classifyTokensWithGroq(tokens);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result['0x123456789']).toBe('AI Agents');
    expect(result['0xabcdef']).toBe('DePIN');
  });

  test('generateNarrativeSignal requests and returns signal sentence string', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: 'Volume surges as decentralized GPU rendering projects expand.'
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

    const signal = await generateNarrativeSignal('AI Compute', ['$NOS'], {
      volume: 450000,
      liquidity: 120000,
      coins: 3
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(signal).toBe('Volume surges as decentralized GPU rendering projects expand.');
  });

  test('Returns empty string silently if Groq signal generator fails', async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.reject(new Error('Rate limit exceeded'))
    ) as any;

    const signal = await generateNarrativeSignal('AI Compute', ['$NOS'], {
      volume: 450000,
      liquidity: 120000,
      coins: 3
    });

    expect(signal).toBe('');
  });
});
