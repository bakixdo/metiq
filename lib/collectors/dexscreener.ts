import { getEnv } from '../config/env';
import { cacheGet, cacheSet } from '../database/redis';

export interface DexScreenerToken {
  chain: string;
  address: string;
  symbol: string;
  name: string;
  price: number;
  marketCap: number | null;
  liquidity: number;
  volume_1h: number;
  volume_6h: number;
  buys_1h: number;
  sells_1h: number;
  price_change_1h: number;
  price_change_6h: number;
  pair_created_at: number | null;
  pair_url: string;
  description: string;
  websites: string[];
  socials: string[];
  isBoosted: boolean;
  narrative?: string;
}

export interface CollectorStatus {
  status: 'operational' | 'degraded' | 'outage';
  errorSummary?: string;
  boostsCount: number;
  profilesCount: number;
  totalCandidates: number;
  filteredCandidates: number;
}

// Helper fetch with timeout, exponential backoff, and 429 rate limit handling
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  delay = 500,
  timeoutMs = 8000
): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);

    if (res.status === 429) {
      if (retries > 0) {
        const wait = delay * 2;
        await new Promise((resolve) => setTimeout(resolve, wait));
        return fetchWithRetry(url, options, retries - 1, wait, timeoutMs);
      }
      throw new Error(`HTTP 429 Too Many Requests from ${url}`);
    }

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status} from ${url}`);
    }

    return await res.json();
  } catch (err: any) {
    clearTimeout(id);
    if (retries > 0 && err.name !== 'AbortError') {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5, timeoutMs);
    }
    throw err;
  }
}

export async function collectMarketData(): Promise<{
  tokens: DexScreenerToken[];
  status: CollectorStatus;
}> {
  const env = getEnv();
  const minLiquidity = env.MIN_LIQUIDITY_USD;
  const maxCandidates = env.MAX_SCAN_CANDIDATES;

  let boostsCount = 0;
  let profilesCount = 0;
  let dexscreenerStatus: 'operational' | 'degraded' | 'outage' = 'operational';
  let errorSummary: string | undefined;

  // Track discovered candidate tokens
  // Key: chainId:tokenAddress
  const candidatesMap = new Map<string, {
    chainId: string;
    tokenAddress: string;
    description: string;
    websites: string[];
    socials: string[];
    isBoosted: boolean;
  }>();

  // Helper to add discovery candidates to candidatesMap
  const addCandidate = (item: any, isBoosted: boolean) => {
    if (!item.chainId || !item.tokenAddress) return;
    const chainId = item.chainId.toLowerCase();
    const tokenAddress = item.tokenAddress.toLowerCase();
    const key = `${chainId}:${tokenAddress}`;

    const description = item.description || '';
    const websites: string[] = [];
    const socials: string[] = [];

    if (Array.isArray(item.links)) {
      item.links.forEach((l: any) => {
        if (!l.url) return;
        if (l.type === 'twitter' || l.type === 'telegram') {
          socials.push(l.url);
        } else {
          websites.push(l.url);
        }
      });
    }

    const existing = candidatesMap.get(key);
    if (existing) {
      candidatesMap.set(key, {
        chainId,
        tokenAddress: item.tokenAddress, // keep original case for display
        description: existing.description || description,
        websites: Array.from(new Set([...existing.websites, ...websites])),
        socials: Array.from(new Set([...existing.socials, ...socials])),
        isBoosted: existing.isBoosted || isBoosted,
      });
    } else {
      candidatesMap.set(key, {
        chainId,
        tokenAddress: item.tokenAddress,
        description,
        websites,
        socials,
        isBoosted,
      });
    }
  };

  // 1. Fetch Discovery Feeds (cached for 5 minutes)
  try {
    let latestBoosts: any[] = [];
    let topBoosts: any[] = [];
    let latestProfiles: any[] = [];

    const cachedFeeds = await cacheGet<{ latestBoosts: any[]; topBoosts: any[]; latestProfiles: any[] }>(
      'metiq:dexscreener:feeds'
    );

    if (cachedFeeds) {
      console.log('🔌 Loading DexScreener discovery feeds from Redis cache...');
      latestBoosts = cachedFeeds.latestBoosts || [];
      topBoosts = cachedFeeds.topBoosts || [];
      latestProfiles = cachedFeeds.latestProfiles || [];
    } else {
      console.log('🔍 DexScreener cache miss. Requesting fresh discovery feeds...');
      const feeds = await Promise.allSettled([
        fetchWithRetry('https://api.dexscreener.com/token-boosts/latest/v1'),
        fetchWithRetry('https://api.dexscreener.com/token-boosts/top/v1'),
        fetchWithRetry('https://api.dexscreener.com/token-profiles/latest/v1')
      ]);

      latestBoosts = feeds[0].status === 'fulfilled' ? feeds[0].value : [];
      topBoosts = feeds[1].status === 'fulfilled' ? feeds[1].value : [];
      latestProfiles = feeds[2].status === 'fulfilled' ? feeds[2].value : [];

      const failures = feeds.filter(f => f.status === 'rejected');
      if (failures.length === 3) {
        // All discovery endpoints failed
        dexscreenerStatus = 'outage';
        const errors = failures.map(f => (f as PromiseRejectedResult).reason.message).join('; ');
        errorSummary = `All DexScreener discovery feeds failed: ${errors}`;
        return {
          tokens: [],
          status: {
            status: dexscreenerStatus,
            errorSummary,
            boostsCount: 0,
            profilesCount: 0,
            totalCandidates: 0,
            filteredCandidates: 0,
          }
        };
      } else if (failures.length > 0) {
        dexscreenerStatus = 'degraded';
        const errors = failures.map(f => (f as PromiseRejectedResult).reason.message).join('; ');
        errorSummary = `Some discovery feeds failed: ${errors}`;
      }

      // Cache the raw discovery feed lists
      await cacheSet('metiq:dexscreener:feeds', { latestBoosts, topBoosts, latestProfiles }, 300);
    }

    // Process items
    if (Array.isArray(latestBoosts)) {
      latestBoosts.forEach(b => addCandidate(b, true));
      boostsCount += latestBoosts.length;
    }
    if (Array.isArray(topBoosts)) {
      topBoosts.forEach(b => addCandidate(b, true));
      boostsCount += topBoosts.length;
    }
    if (Array.isArray(latestProfiles)) {
      latestProfiles.forEach(p => addCandidate(p, false));
      profilesCount += latestProfiles.length;
    }
  } catch (err: any) {
    dexscreenerStatus = 'outage';
    errorSummary = `DexScreener discovery extraction error: ${err.message}`;
    return {
      tokens: [],
      status: {
        status: dexscreenerStatus,
        errorSummary,
        boostsCount: 0,
        profilesCount: 0,
        totalCandidates: 0,
        filteredCandidates: 0,
      }
    };
  }

  const totalCandidates = candidatesMap.size;
  if (totalCandidates === 0) {
    return {
      tokens: [],
      status: {
        status: dexscreenerStatus,
        errorSummary: errorSummary || 'No candidate tokens discovered from feeds.',
        boostsCount,
        profilesCount,
        totalCandidates: 0,
        filteredCandidates: 0,
      }
    };
  }

  // Convert candidates map to array and limit candidates to prevent abusing rate limits
  const allCandidates = Array.from(candidatesMap.values()).slice(0, maxCandidates);

  // Group candidates by chain to batch query their market pairs
  const chainGroups = new Map<string, typeof allCandidates>();
  allCandidates.forEach(cand => {
    const list = chainGroups.get(cand.chainId) || [];
    list.push(cand);
    chainGroups.set(cand.chainId, list);
  });

  const finalPairs: DexScreenerToken[] = [];
  const queryPromises: Promise<void>[] = [];

  // Limit batch concurrency: Query chain batches sequentially or in limited parallel groups
  for (const [chainId, candidates] of chainGroups.entries()) {
    // Batch size for /tokens/v1 endpoint is usually max 30 tokens
    const batchSize = 30;
    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize);

      queryPromises.push((async () => {
        try {
          // Check Redis cache for candidates in this batch first
          const cachedPairs: any[] = [];
          const uncachedCandidates: typeof batch = [];

          await Promise.all(batch.map(async (cand) => {
            const cacheKey = `metiq:token:${chainId}:${cand.tokenAddress.toLowerCase()}`;
            const cached = await cacheGet<any[]>(cacheKey);
            if (cached) {
              cachedPairs.push(...cached);
            } else {
              uncachedCandidates.push(cand);
            }
          }));

          let fetchedPairs: any[] = [];
          if (uncachedCandidates.length > 0) {
            const uncachedAddresses = uncachedCandidates.map(c => c.tokenAddress).join(',');
            const url = `https://api.dexscreener.com/tokens/v1/${chainId}/${uncachedAddresses}`;
            const pairsData = await fetchWithRetry(url, {}, 2, 300, 6000);

            if (Array.isArray(pairsData)) {
              fetchedPairs = pairsData;

              // Group fetched pairs by token address to cache them
              const fetchedMap = new Map<string, any[]>();
              pairsData.forEach((pair: any) => {
                if (!pair.baseToken?.address) return;
                const address = pair.baseToken.address.toLowerCase();
                const list = fetchedMap.get(address) || [];
                list.push(pair);
                fetchedMap.set(address, list);
              });

              // Cache each token's pairs individually
              await Promise.all(uncachedCandidates.map(async (cand) => {
                const addressKey = cand.tokenAddress.toLowerCase();
                const pairs = fetchedMap.get(addressKey) || [];
                const cacheKey = `metiq:token:${chainId}:${addressKey}`;
                await cacheSet(cacheKey, pairs, 300); // cache for 5 minutes (even if empty to prevent spamming dead tokens)
              }));
            }
          }

          const combinedPairs = [...cachedPairs, ...fetchedPairs];
          if (combinedPairs.length > 0) {
            // Group returned pairs by token address
            const tokenPairsMap = new Map<string, any[]>();
            combinedPairs.forEach((pair: any) => {
              if (!pair.baseToken?.address) return;
              const address = pair.baseToken.address.toLowerCase();
              const list = tokenPairsMap.get(address) || [];
              list.push(pair);
              tokenPairsMap.set(address, list);
            });

            // Select the most liquid pair for each token
            batch.forEach(candidate => {
              const addressKey = candidate.tokenAddress.toLowerCase();
              const pairs = tokenPairsMap.get(addressKey);
              if (!pairs || pairs.length === 0) return;

              // Sort by liquidity USD descending
              const bestPair = pairs.sort((a: any, b: any) => {
                const liqA = Number(a.liquidity?.usd) || 0;
                const liqB = Number(b.liquidity?.usd) || 0;
                return liqB - liqA;
              })[0];

              const liquidityUsd = Number(bestPair.liquidity?.usd) || 0;
              if (liquidityUsd < minLiquidity) return; // filter by minimum liquidity

              // Enrich with metadata from discovery feeds
              const bestPairInfo = bestPair.info || {};
              const websites = Array.from(new Set([
                ...candidate.websites,
                ...(bestPairInfo.websites || []).map((w: any) => w.url).filter(Boolean)
              ]));
              const socials = Array.from(new Set([
                ...candidate.socials,
                ...(bestPairInfo.socials || []).map((s: any) => s.url).filter(Boolean)
              ]));

              // Combine description from best pair info and candidate
              const descList = [candidate.description, bestPairInfo.description].filter(Boolean);
              const combinedDesc = descList.join('\n').trim();

              finalPairs.push({
                chain: bestPair.chainId,
                address: bestPair.baseToken.address,
                symbol: bestPair.baseToken.symbol,
                name: bestPair.baseToken.name,
                price: Number(bestPair.priceUsd) || 0,
                marketCap: bestPair.marketCap ? Number(bestPair.marketCap) : (bestPair.fdv ? Number(bestPair.fdv) : null),
                liquidity: liquidityUsd,
                volume_1h: Number(bestPair.volume?.h1) || 0,
                volume_6h: Number(bestPair.volume?.h6) || 0,
                buys_1h: Number(bestPair.txns?.h1?.buys) || 0,
                sells_1h: Number(bestPair.txns?.h1?.sells) || 0,
                price_change_1h: Number(bestPair.priceChange?.h1) || 0,
                price_change_6h: Number(bestPair.priceChange?.h6) || 0,
                pair_created_at: bestPair.pairCreatedAt || null,
                pair_url: bestPair.url,
                description: combinedDesc,
                websites,
                socials,
                isBoosted: candidate.isBoosted,
              });
            });
          }
        } catch (err: any) {
          // Do not crash the entire scan if one batch fails
          console.warn(`⚠️ Failed to collect batch details for chain ${chainId}: ${err.message}`);
          if (dexscreenerStatus === 'operational') {
            dexscreenerStatus = 'degraded';
          }
          errorSummary = [errorSummary, `Batch details error on ${chainId}: ${err.message}`].filter(Boolean).join('; ');
        }
      })());
    }
  }

  // Wait for all batches to finish querying
  await Promise.allSettled(queryPromises);

  return {
    tokens: finalPairs,
    status: {
      status: dexscreenerStatus,
      errorSummary,
      boostsCount,
      profilesCount,
      totalCandidates,
      filteredCandidates: finalPairs.length,
    }
  };
}
