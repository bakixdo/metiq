import crypto from 'crypto';

// Replicating safeCompare logic used in webhook and cron routes
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

describe('Webhook and Cron Secret Verification Tests', () => {
  const LOCAL_SECRET = 'x-metiq-secure-webhook-token-v1';

  test('Accepts valid webhook secret token match', () => {
    const receivedHeader = 'x-metiq-secure-webhook-token-v1';
    expect(safeCompare(receivedHeader, LOCAL_SECRET)).toBe(true);
  });

  test('Rejects invalid secret token', () => {
    const receivedHeader = 'malicious-injected-token';
    expect(safeCompare(receivedHeader, LOCAL_SECRET)).toBe(false);
  });

  test('Rejects blank or empty secret headers', () => {
    expect(safeCompare('', LOCAL_SECRET)).toBe(false);
  });

  test('Rejects matching prefixes of incorrect lengths', () => {
    const truncatedSecret = LOCAL_SECRET.substring(0, 10);
    expect(safeCompare(truncatedSecret, LOCAL_SECRET)).toBe(false);
  });
});
