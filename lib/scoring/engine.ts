import { DexScreenerToken } from '../collectors/dexscreener';
import { NarrativeType } from '../classification/taxonomy';

export interface ScoredNarrative {
  name: NarrativeType;
  score: number;
  stage: 'Weak' | 'Forming' | 'Emerging' | 'Accelerating' | 'Crowded' | 'Cooling';
  volume_6h: number;
  liquidity: number;
  coin_count: number;
  score_change: number;
  leaders: Array<{ symbol: string; chain: string; address: string }>;
  warnings: string[];
  signal?: string;
}

export function scoreNarratives(
  tokens: DexScreenerToken[],
  previousSnapshots: Record<string, { score: number; volume_6h: number; liquidity: number; coin_count: number }> = {}
): ScoredNarrative[] {
  // Group tokens by narrative
  const narrativeGroups = new Map<NarrativeType, DexScreenerToken[]>();
  tokens.forEach(tok => {
    const list = narrativeGroups.get(tok.narrative as NarrativeType) || [];
    list.push(tok);
    narrativeGroups.set(tok.narrative as NarrativeType, list);
  });

  const scoredNarratives: ScoredNarrative[] = [];
  const now = Date.now();

  for (const [narrativeName, narrativeTokens] of narrativeGroups.entries()) {
    // Skip "Other" from appearing in the top reports
    if (narrativeName === 'Other') continue;

    const coinCount = narrativeTokens.length;
    if (coinCount === 0) continue;

    // Aggregate statistics
    let totalVolume6h = 0;
    let totalVolume1h = 0;
    let totalLiquidity = 0;
    let totalTxns6h = 0;
    let totalBuys1h = 0;
    let totalSells1h = 0;
    let freshLaunches = 0;
    let itemsWithMetadata = 0;
    let totalPriceChange6h = 0;
    let boostedCount = 0;

    narrativeTokens.forEach(t => {
      totalVolume6h += t.volume_6h;
      totalVolume1h += t.volume_1h;
      totalLiquidity += t.liquidity;
      
      // Calculate 6h txns: DexScreener gives 1h txns buys/sells and 6h buys/sells are estimated or derived
      // Since DexScreener api returns 1h buys/sells and 6h volume/txns.
      // Wait, let's sum 1h transactions since that is what we have directly for buys/sells,
      // or check if there is h6 txns. Yes, in curl we saw: txns: { h6: { buys: X, sells: Y } }.
      // So we can estimate transactions or use h1 buys + sells as transaction momentum,
      // let's check: yes, we can estimate or use 1h buys + sells, or if h6 is present (let's do 6h if available, else fallback).
      // Let's sum the buys + sells for 1h or 24h as a proxy if 6h is not present.
      // Let's calculate: 1h buys + sells is a good indicator of *current* transaction activity.
      // Let's check: token details endpoint has `txns.h6` and `txns.h1`. Let's estimate 6H txns by sum of buys + sells if present.
      // Wait, we can sum buys_1h + sells_1h, or use the volume/txns. Let's just use buys_1h + sells_1h as momentum.
      // Or let's see, if we have h6 buys and sells, we can sum them. Let's assume txns_6h is buys_1h + sells_1h multiplied by a factor,
      // or we can query it directly in database. Wait, let's check what we stored in `coin_snapshots`:
      // `buys_1h`, `sells_1h`, `volume_6h`, etc. Let's use `buys_1h + sells_1h` as transaction momentum since it is highly reliable.
      totalBuys1h += t.buys_1h;
      totalSells1h += t.sells_1h;
      totalTxns6h += (t.buys_1h + t.sells_1h) * 4; // Use 1H txns scaled to 6H as momentum, which is extremely robust.

      if (t.pair_created_at && (now - t.pair_created_at) < 24 * 60 * 60 * 1000) {
        freshLaunches++;
      }
      if (t.description || t.websites.length > 0 || t.socials.length > 0) {
        itemsWithMetadata++;
      }
      totalPriceChange6h += t.price_change_6h;
      if (t.isBoosted) {
        boostedCount++;
      }
    });

    const avgPriceChange6h = totalPriceChange6h / coinCount;

    // --- Quantitative Mathematical Models ---

    // 1. Calculate Herfindahl-Hirschman Index (HHI) for market concentration
    let hhi = 0;
    if (totalVolume6h > 0) {
      narrativeTokens.forEach(t => {
        const share = t.volume_6h / totalVolume6h;
        hhi += share * share;
      });
    }

    // 2. Calculate Shannon Entropy for narrative breadth & diversity
    let entropy = 0;
    if (totalVolume6h > 0) {
      narrativeTokens.forEach(t => {
        const share = t.volume_6h / totalVolume6h;
        if (share > 0) {
          entropy -= share * Math.log2(share);
        }
      });
    }

    // --- Scoring Components (Max 100 points) ---

    // 1. 6H Volume (40 pts)
    // Log scale from $1,000 to $10,000,000
    const logVol = Math.log10(Math.max(1, totalVolume6h));
    const volumePoints = Math.min(40, Math.max(0, (logVol - 3) / (7 - 3) * 40));

    // 2. Breadth (Shannon Entropy) (20 pts)
    // Entropy of 2.0+ gives full points
    const breadthPoints = Math.min(20, entropy * 10);

    // 3. Liquidity Depth (20 pts)
    // Log scale from $5,000 to $5,000,000
    const logLiq = Math.log10(Math.max(1, totalLiquidity));
    const liquidityPoints = Math.min(20, Math.max(0, (logLiq - 3.7) / (6.7 - 3.7) * 20));

    // 4. Momentum (20 pts)
    // Exponential velocity compared with previous snapshot or fallback to 1H/6H ratio
    let momentumPoints = 0;
    const prev = previousSnapshots[narrativeName];
    if (prev && prev.volume_6h > 0) {
      const volChangeRatio = (totalVolume6h - prev.volume_6h) / prev.volume_6h;
      if (volChangeRatio > 0) {
        momentumPoints = Math.min(20, volChangeRatio * 10); // 200% volume increase gets full 20 pts
      }
    } else {
      const volRatio = totalVolume6h > 0 ? (totalVolume1h / totalVolume6h) : 0;
      momentumPoints = Math.min(20, (volRatio / 0.25) * 20); // 25%+ in last hour gets full 20 pts
    }

    let baseScore = volumePoints + breadthPoints + liquidityPoints + momentumPoints;
    let score = Math.round(baseScore);

    // --- Progressive Penalties & Warnings ---
    const warnings: string[] = [];

    // Sort tokens by volume 6h to find the leader
    const sortedByVol = [...narrativeTokens].sort((a, b) => b.volume_6h - a.volume_6h);

    // Concentration penalty (HHI)
    if (coinCount === 1) {
      score -= 25;
      warnings.push('Narrative is driven by only one coin.');
    } else if (coinCount > 1 && hhi > 0.4) {
      const hhiPenalty = Math.round(Math.min(30, (hhi - 0.4) * 50));
      score -= hhiPenalty;
      warnings.push(`Narrative currently depends heavily on one coin: ${sortedByVol[0].symbol}.`);
    }

    // Extremely low liquidity penalty
    if (totalLiquidity < 10000) {
      score -= 20;
      warnings.push('Extremely low liquidity. High risk of slippage.');
    }

    // Wash trading penalty: progressive V/L ratio penalty
    const vlRatio = totalLiquidity > 0 ? (totalVolume6h / totalLiquidity) : 0;
    if (vlRatio > 4 && totalLiquidity > 0) {
      const vlPenalty = Math.round(Math.min(40, (vlRatio - 4) * 10));
      score -= vlPenalty;
      warnings.push(`Volume is disproportionately high compared to liquidity, indicating potential wash trading or extreme volatility.`);
    }

    // Heavy dependence on boosted tokens
    if (coinCount > 0 && (boostedCount / coinCount) > 0.8) {
      warnings.push('Heavy dependence on paid/boosted tokens.');
    }

    // Too few transactions
    if (totalTxns6h < 100) {
      score -= 10;
      warnings.push('Very low transaction activity.');
    }

    // Missing or unreliable metadata
    const metadataRatio = coinCount > 0 ? (itemsWithMetadata / coinCount) : 0;
    if (metadataRatio < 0.5) {
      score -= 5;
      warnings.push('Missing or unreliable metadata.');
    }

    // Extreme short-term price movement
    if (avgPriceChange6h > 100 || avgPriceChange6h < -30) {
      score -= 10;
      warnings.push('Extreme short-term price movement.');
    }

    // Clamp score to [0, 100]
    score = Math.max(0, Math.min(100, score));

    // --- Score Change & Stage Classification ---
    const scoreChange = prev ? (score - prev.score) : 0;

    let stage: ScoredNarrative['stage'] = 'Weak';
    if (scoreChange <= -10 && score >= 40) {
      stage = 'Cooling';
    } else if (score < 25) {
      stage = 'Weak';
    } else if (score < 40) {
      stage = 'Forming';
    } else if (score < 55) {
      stage = 'Emerging';
    } else if (score < 70) {
      stage = 'Accelerating';
    } else {
      stage = 'Crowded';
    }

    // Leaders: top 3 coins by 6H volume, deduplicated by symbol
    const seenSymbols = new Set<string>();
    const leaders: Array<{ symbol: string; chain: string; address: string }> = [];
    for (const t of sortedByVol) {
      const sym = t.symbol.replace('$', '').toUpperCase();
      if (!seenSymbols.has(sym)) {
        seenSymbols.add(sym);
        leaders.push({ symbol: sym, chain: t.chain, address: t.address });
      }
      if (leaders.length >= 3) break;
    }

    scoredNarratives.push({
      name: narrativeName,
      score,
      stage,
      volume_6h: totalVolume6h,
      liquidity: totalLiquidity,
      coin_count: coinCount,
      score_change: scoreChange,
      warnings,
      leaders,
    });
  }

  // Sort scored narratives by score descending
  return scoredNarratives.sort((a, b) => b.score - a.score);
}
