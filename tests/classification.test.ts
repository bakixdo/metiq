import { classifyToken } from '@/lib/classification/taxonomy';

describe('Narrative Classification Tests', () => {
  test('AI Agents narrative matches agent keyword in symbol', () => {
    const token = {
      name: 'Autonomous Assistant',
      symbol: 'AGENT',
      description: 'A community project experimenting with bots.',
    };
    expect(classifyToken(token)).toBe('AI Agents');
  });

  test('AI Compute narrative matches gpu in description', () => {
    const token = {
      name: 'Decentralized Grid',
      symbol: 'GRID',
      description: 'Rent or share compute power using high-end GPUs.',
    };
    expect(classifyToken(token)).toBe('AI Compute');
  });

  test('DePIN narrative matches depin or physical infrastructure', () => {
    const token = {
      name: 'Helium Hotspot',
      symbol: 'HNT',
      description: 'Decentralized physical infrastructure network for wireless connectivity.',
    };
    expect(classifyToken(token)).toBe('DePIN');
  });

  test('Stocks narrative matches roaring kitty', () => {
    const token = {
      name: 'Roaring Kitty Meme Token',
      symbol: 'KITTY',
      description: 'WSB roaring kitty inspiration.',
    };
    expect(classifyToken(token)).toBe('Stocks');
  });

  test('Animal Memes narrative matches dog or shib', () => {
    const token = {
      name: 'Cute Dog Token',
      symbol: 'SHIB',
      description: 'A community driven animal meme token.',
    };
    expect(classifyToken(token)).toBe('Animal Memes');
  });

  test('Unknown token falls back to Other narrative', () => {
    const token = {
      name: 'Generic Random Coin',
      symbol: 'GEN',
      description: 'A simple coin without any match.',
    };
    expect(classifyToken(token)).toBe('Other');
  });
});
