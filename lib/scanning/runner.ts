import { getDb } from '../database/db';
import { collectMarketData } from '../collectors/dexscreener';
import { classifyToken } from '../classification/taxonomy';
import { scoreNarratives, ScoredNarrative } from '../scoring/engine';
import { formatTelegramReport } from '../reports/formatter';
import { getEnv } from '../config/env';
import { classifyTokensWithGroq, generateNarrativeSignal } from '../classification/groq';

export interface ScanResult {
  scanId: string;
  status: 'completed' | 'running' | 'failed' | 'cooldown';
  completedAt?: Date;
  coinsScanned: number;
  reportHtml?: string;
  narratives: ScoredNarrative[];
  alreadyRunning: boolean;
  cooldownRemainingSeconds?: number;
}

export async function runScan(triggerSource: 'cron' | 'manual'): Promise<ScanResult> {
  const supabase = getDb();
  const env = getEnv();
  const cooldownSeconds = env.MANUAL_SCAN_COOLDOWN_SECONDS;

  // 1. MUTEX LOCK CHECK: Prevent two scans from running simultaneously
  // Look for any scan currently in 'running' state started in the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data: runningScans, error: runningCheckError } = await supabase
    .from('scans')
    .select('id, started_at, report_html, coins_scanned')
    .eq('status', 'running')
    .gt('started_at', fiveMinutesAgo)
    .limit(1);

  if (runningCheckError) {
    console.error('Database query error checking active scans:', runningCheckError);
  }

  if (runningScans && runningScans.length > 0) {
    // A scan is already running. Return the last completed scan.
    const { data: latestCompleted } = await supabase
      .from('scans')
      .select('id, completed_at, coins_scanned, report_html')
      .eq('status', 'completed')
      .order('started_at', { ascending: false })
      .limit(1);

    return {
      scanId: runningScans[0].id,
      status: 'running',
      coinsScanned: latestCompleted?.[0]?.coins_scanned || 0,
      reportHtml: latestCompleted?.[0]?.report_html || 'Scan in progress. No report available yet.',
      narratives: [],
      alreadyRunning: true,
    };
  }

  // 2. COOLDOWN CHECK: Enforce limit on manual scans
  if (triggerSource === 'manual') {
    const { data: latestScan, error: latestError } = await supabase
      .from('scans')
      .select('completed_at, report_html, coins_scanned, id')
      .eq('status', 'completed')
      .order('started_at', { ascending: false })
      .limit(1);

    if (latestScan && latestScan.length > 0 && latestScan[0].completed_at) {
      const lastCompletedTime = new Date(latestScan[0].completed_at).getTime();
      const diffSeconds = Math.floor((Date.now() - lastCompletedTime) / 1000);

      if (diffSeconds < cooldownSeconds) {
        // Cooldown period active. Fetch meta snapshots for the latest scan to return narrative details
        const { data: snaps } = await supabase
          .from('meta_snapshots')
          .select('name, score, stage, volume_6h, liquidity, coin_count, score_change, warnings')
          .eq('scan_id', latestScan[0].id);

        const narratives: ScoredNarrative[] = (snaps || []).map((s: any) => ({
          name: s.name,
          score: s.score,
          stage: s.stage,
          volume_6h: Number(s.volume_6h),
          liquidity: Number(s.liquidity),
          coin_count: s.coin_count,
          score_change: s.score_change,
          warnings: s.warnings || [],
          leaders: [], // We don't need leaders loaded for simple cooldown status responses
        }));

        return {
          scanId: latestScan[0].id,
          status: 'cooldown',
          completedAt: new Date(latestScan[0].completed_at),
          coinsScanned: latestScan[0].coins_scanned,
          reportHtml: latestScan[0].report_html,
          narratives,
          alreadyRunning: false,
          cooldownRemainingSeconds: cooldownSeconds - diffSeconds,
        };
      }
    }
  }

  // 3. START A NEW SCAN
  const { data: newScan, error: insertError } = await supabase
    .from('scans')
    .insert({
      status: 'running',
      started_at: new Date().toISOString(),
      trigger: triggerSource,
    })
    .select()
    .single();

  if (insertError || !newScan) {
    throw new Error(`Failed to create scan record: ${insertError?.message || 'Unknown database error'}`);
  }

  const scanId = newScan.id;

  try {
    // 4. COLLECT DATA
    const { tokens, status: collectorStatus } = await collectMarketData();

    if (tokens.length === 0) {
      throw new Error(`Market data collection returned zero tokens. Details: ${collectorStatus.errorSummary || 'No error details'}`);
    }

    // 5. CLASSIFY TOKENS (with optional Groq AI classification and manual taxonomy fallback)
    let aiClassifications: Record<string, string> = {};
    if (env.GROQ_API_KEY) {
      try {
        console.log('🤖 Triggering Groq API for token classification...');
        aiClassifications = await classifyTokensWithGroq(tokens);
      } catch (err: any) {
        console.warn('⚠️ Groq classification failed, falling back to taxonomy matching:', err.message);
      }
    }

    const classifiedTokens = tokens.map(tok => {
      let narrative = aiClassifications[tok.address.toLowerCase()];
      if (!narrative) {
        narrative = classifyToken({
          name: tok.name,
          symbol: tok.symbol,
          description: tok.description,
        });
      }
      return {
        ...tok,
        narrative,
      };
    });

    // 6. RETRIEVE PREVIOUS SNAPSHOTS FOR DELTA SCORING
    // Find the latest completed scan before this current one
    const { data: lastCompletedScan } = await supabase
      .from('scans')
      .select('id')
      .eq('status', 'completed')
      .order('started_at', { ascending: false })
      .limit(1);

    const previousSnapshots: Record<string, { score: number; volume_6h: number; liquidity: number; coin_count: number }> = {};
    if (lastCompletedScan && lastCompletedScan.length > 0) {
      const { data: snaps } = await supabase
        .from('meta_snapshots')
        .select('name, score, volume_6h, liquidity, coin_count')
        .eq('scan_id', lastCompletedScan[0].id);

      if (snaps) {
        snaps.forEach((s: any) => {
          previousSnapshots[s.name] = {
            score: s.score,
            volume_6h: Number(s.volume_6h),
            liquidity: Number(s.liquidity),
            coin_count: s.coin_count,
          };
        });
      }
    }

    // 7. SCORE NARRATIVES
    const scoredNarratives = scoreNarratives(classifiedTokens, previousSnapshots);

    // 7.5. GENERATE AI SIGNALS FOR TOP 5 NARRATIVES
    if (env.GROQ_API_KEY && scoredNarratives.length > 0) {
      console.log('🤖 Generating dynamic market intelligence signals via Groq...');
      const signalPromises = scoredNarratives.slice(0, 5).map(async (sn) => {
        if (sn.warnings.length === 0) {
          try {
            const signal = await generateNarrativeSignal(sn.name, sn.leaders, {
              volume: sn.volume_6h,
              liquidity: sn.liquidity,
              coins: sn.coin_count,
            });
            if (signal) {
              sn.signal = signal;
            }
          } catch (err: any) {
            console.warn(`⚠️ Failed to generate AI signal for narrative ${sn.name}:`, err.message);
          }
        }
      });
      await Promise.allSettled(signalPromises);
    }

    // 8. FORMAT REPORT HTML
    const completedAt = new Date();
    const reportHtml = formatTelegramReport(completedAt, classifiedTokens.length, scoredNarratives, collectorStatus.status);

    // 9. PERSIST DETAILS TO DATABASE
    // Insert meta snapshots
    if (scoredNarratives.length > 0) {
      const { error: metaErr } = await supabase.from('meta_snapshots').insert(
        scoredNarratives.map(sn => ({
          scan_id: scanId,
          name: sn.name,
          score: sn.score,
          stage: sn.stage,
          volume_6h: sn.volume_6h,
          liquidity: sn.liquidity,
          coin_count: sn.coin_count,
          score_change: sn.score_change,
          warnings: sn.warnings,
        }))
      );
      if (metaErr) throw metaErr;
    }

    // Insert coin snapshots (only store tokens that were successfully classified into a narrative)
    const classifiedTokensOnly = classifiedTokens.filter(t => t.narrative !== 'Other');
    if (classifiedTokensOnly.length > 0) {
      const { error: coinErr } = await supabase.from('coin_snapshots').insert(
        classifiedTokensOnly.map(t => ({
          scan_id: scanId,
          chain: t.chain,
          address: t.address,
          symbol: t.symbol,
          name: t.name,
          narrative: t.narrative,
          market_cap: t.marketCap,
          liquidity: t.liquidity,
          volume_1h: t.volume_1h,
          volume_6h: t.volume_6h,
          buys_1h: t.buys_1h,
          sells_1h: t.sells_1h,
          price_change_1h: t.price_change_1h,
          price_change_6h: t.price_change_6h,
          pair_created_at: t.pair_created_at,
          pair_url: t.pair_url,
        }))
      );
      if (coinErr) throw coinErr;
    }

    // Update scan status to completed
    const { error: updateErr } = await supabase
      .from('scans')
      .update({
        status: 'completed',
        completed_at: completedAt.toISOString(),
        coins_scanned: classifiedTokens.length,
        report_html: reportHtml,
        sources: collectorStatus,
      })
      .eq('id', scanId);

    if (updateErr) throw updateErr;

    return {
      scanId,
      status: 'completed',
      completedAt,
      coinsScanned: classifiedTokens.length,
      reportHtml,
      narratives: scoredNarratives,
      alreadyRunning: false,
    };
  } catch (err: any) {
    console.error(`❌ Scan ID ${scanId} failed:`, err);
    
    // Mark scan as failed in database
    await supabase
      .from('scans')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_summary: err.message || 'Unknown scanning error',
      })
      .eq('id', scanId);

    throw err;
  }
}
