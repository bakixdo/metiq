import { formatCurrency, formatUtcDate, formatTelegramReport } from '@/lib/reports/formatter';
import { escapeHtml, splitMessage } from '@/lib/telegram/bot';
import { ScoredNarrative } from '@/lib/scoring/engine';

describe('Formatting and Splitting Utility Tests', () => {
  
  test('formatCurrency formats values under and over million and thousand boundaries', () => {
    expect(formatCurrency(4820000)).toBe('$4.82M');
    expect(formatCurrency(780000)).toBe('$780K');
    expect(formatCurrency(450)).toBe('$450');
    expect(formatCurrency(0)).toBe('$0');
  });

  test('formatUtcDate translates Dates to UTC string representation', () => {
    // Month is 0-indexed: 7 corresponds to August
    const date = new Date(Date.UTC(2026, 7, 8, 12, 0, 0));
    expect(formatUtcDate(date)).toBe('8 Aug 2026, 12:00 UTC');
  });

  test('escapeHtml replaces HTML special characters', () => {
    const text = 'Tokens & Teams < "Volume" > Cooldowns';
    const expected = 'Tokens &amp; Teams &lt; &quot;Volume&quot; &gt; Cooldowns';
    expect(escapeHtml(text)).toBe(expected);
  });

  test('splitMessage chunks long text at line limits without cutting words', () => {
    const section1 = 'A'.repeat(595);
    const section2 = 'Section 2\n' + 'B'.repeat(10);
    const combined = `${section1}\n${section2}`;
    
    // Split with strict limit of 600 chars
    const chunks = splitMessage(combined, 600);
    expect(chunks.length).toBe(2);
    expect(chunks[0]).toContain('AAAA');
    expect(chunks[1]).toContain('Section 2');
  });

  test('formatTelegramReport generates structured HTML matching instructions', () => {
    const completedAt = new Date(Date.UTC(2026, 7, 8, 12, 0, 0));
    const narratives: ScoredNarrative[] = [
      {
        name: 'AI Compute',
        score: 84,
        stage: 'Accelerating',
        volume_6h: 4820000,
        liquidity: 1210000,
        coin_count: 12,
        score_change: 4,
        warnings: [],
        leaders: [
          { symbol: 'AAA', chain: 'solana', address: '0x111' },
          { symbol: 'BBB', chain: 'solana', address: '0x222' },
          { symbol: 'CCC', chain: 'solana', address: '0x333' }
        ],
      },
    ];

    const htmlReport = formatTelegramReport(completedAt, 126, narratives, 'operational');

    expect(htmlReport).toContain('METIQ - 6H META REPORT');
    expect(htmlReport).toContain('Updated: 8 Aug 2026, 12:00 UTC');
    expect(htmlReport).toContain('Coins scanned: 126');
    expect(htmlReport).toContain('1. AI Compute - 84/100 (+4) 🔥');
    expect(htmlReport).toContain('Stage: <b>Accelerating</b>');
    expect(htmlReport).toContain('6H Volume: $4.82M');
    expect(htmlReport).toContain('Liquidity: $1.21M');
    expect(htmlReport).toContain('V/L Ratio: <b>3.98x</b>');
    expect(htmlReport).toContain('Active Coins: 12');
    expect(htmlReport).toContain('<a href="https://dexscreener.com/solana/0x111">AAA</a>');
    expect(htmlReport).toContain('Signal: <i>Volume and market breadth are increasing.</i>');
    expect(htmlReport).toContain('Data source: DexScreener (OK)');
    expect(htmlReport).toContain('Request fresh scan: /meta');
  });

  test('formatTelegramReport includes AI provider suffix if provided', () => {
    const completedAt = new Date();
    const htmlReport = formatTelegramReport(completedAt, 10, [], 'operational', 'Groq');
    expect(htmlReport).toContain('Data source: DexScreener (OK) · AI: Groq');
  });
});
