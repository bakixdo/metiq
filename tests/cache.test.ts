import { cacheGet, cacheSet, cacheDel, getRedis } from '@/lib/database/redis';

jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => {
      return {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
      };
    }),
  };
});

describe('Upstash Redis Caching Layer Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      UPSTASH_REDIS_REST_URL: 'https://mock-redis.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'mock-token',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('getRedis returns redis client instance when credentials are set', () => {
    const client = getRedis();
    expect(client).toBeDefined();
    expect(client).not.toBeNull();
  });

  test('cacheGet returns value from mock redis client', async () => {
    const client = getRedis();
    const mockValue = { foo: 'bar' };
    (client!.get as jest.Mock).mockResolvedValueOnce(mockValue);

    const result = await cacheGet<typeof mockValue>('test-key');
    expect(client!.get).toHaveBeenCalledWith('test-key');
    expect(result).toEqual(mockValue);
  });

  test('cacheGet returns null and does not throw on connection failure', async () => {
    const client = getRedis();
    (client!.get as jest.Mock).mockRejectedValueOnce(new Error('Connection timeout'));

    const result = await cacheGet('test-key');
    expect(result).toBeNull();
  });

  test('cacheSet triggers set on client with ttl options', async () => {
    const client = getRedis();
    (client!.set as jest.Mock).mockResolvedValueOnce('OK');

    await cacheSet('test-key', 'value', 300);
    expect(client!.set).toHaveBeenCalledWith('test-key', 'value', { ex: 300 });
  });

  test('cacheDel calls client del', async () => {
    const client = getRedis();
    (client!.del as jest.Mock).mockResolvedValueOnce(1);

    await cacheDel('test-key');
    expect(client!.del).toHaveBeenCalledWith('test-key');
  });

  test('cache operations bypass client and fail silently if credentials are missing', async () => {
    process.env.UPSTASH_REDIS_REST_URL = '';
    process.env.UPSTASH_REDIS_REST_TOKEN = '';

    // Reinitialize module with blank credentials
    const { cacheGet: blankGet } = require('@/lib/database/redis');
    
    const result = await blankGet('test-key');
    expect(result).toBeNull();
  });
});
