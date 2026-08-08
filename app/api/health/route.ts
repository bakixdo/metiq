import { NextRequest } from 'next/server';
import { getDb } from '@/lib/database/db';
import { getEnv } from '@/lib/config/env';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const start = Date.now();
  
  const uptime = {
    web: 'operational',
    telegram: 'operational',
    database: 'operational',
    dexscreener: 'operational',
    groq: 'operational',
  };

  let latestScanInfo = {
    status: 'none',
    completedAt: 'N/A',
    coinsScanned: 0,
  };

  const env = getEnv();

  // 1. Check Database and Fetch Latest Scan info
  try {
    const supabase = getDb();
    const dbStart = Date.now();
    const { data: latestScan, error: dbError } = await supabase
      .from('scans')
      .select('status, completed_at, coins_scanned, sources')
      .eq('status', 'completed')
      .order('started_at', { ascending: false })
      .limit(1);

    if (dbError) {
      uptime.database = 'outage';
    } else {
      uptime.database = 'operational';
      if (latestScan && latestScan.length > 0) {
        latestScanInfo = {
          status: latestScan[0].status,
          completedAt: latestScan[0].completed_at || 'N/A',
          coinsScanned: latestScan[0].coins_scanned,
        };
        // Fetch DexScreener status from the last recorded scan
        const lastDexStatus = latestScan[0].sources?.status;
        if (lastDexStatus) {
          uptime.dexscreener = lastDexStatus;
        }
      }
    }
  } catch (err: any) {
    console.error('Health Check: Database connection failed:', err.message);
    uptime.database = 'outage';
  }

  // 2. Check Telegram Bot Connectivity (lightweight getMe check with timeout)
  if (env.TELEGRAM_BOT_TOKEN) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout

    try {
      const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status === 401 || res.status === 404) {
        uptime.telegram = 'outage';
      } else if (!res.ok) {
        uptime.telegram = 'degraded';
      } else {
        uptime.telegram = 'operational';
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('Health Check: Telegram getMe request failed or timed out:', err.message);
      // Degraded or outage depending on network
      uptime.telegram = 'degraded';
    }
  } else {
    uptime.telegram = 'outage';
  }

  // 3. Live DexScreener check if not already degraded by the last scan (lightweight check with timeout)
  if (uptime.dexscreener === 'operational') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout
    try {
      const res = await fetch('https://api.dexscreener.com/token-profiles/latest/v1', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        uptime.dexscreener = 'degraded';
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      uptime.dexscreener = 'degraded';
    }
  }

  // 4. Check Groq AI Connectivity if API key is present
  if (env.GROQ_API_KEY) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status === 401 || res.status === 403) {
        uptime.groq = 'outage';
      } else if (!res.ok) {
        uptime.groq = 'degraded';
      } else {
        uptime.groq = 'operational';
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('Health Check: Groq models check failed or timed out:', err.message);
      uptime.groq = 'degraded';
    }
  } else {
    uptime.groq = 'unconfigured';
  }

  // Calculate Overall Status
  let overallStatus: 'operational' | 'degraded' | 'outage' = 'operational';
  
  if (uptime.web === 'outage' || uptime.database === 'outage') {
    overallStatus = 'outage';
  } else if (
    uptime.telegram === 'outage' || 
    uptime.dexscreener === 'outage' ||
    uptime.telegram === 'degraded' || 
    uptime.dexscreener === 'degraded' ||
    uptime.database === 'degraded' ||
    uptime.groq === 'outage' ||
    uptime.groq === 'degraded'
  ) {
    overallStatus = 'degraded';
  }

  const executionTimeMs = Date.now() - start;

  return Response.json(
    {
      status: overallStatus,
      service: 'METIQ',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      executionTimeMs,
      uptime,
      latestScan: {
        status: latestScanInfo.status,
        completedAt: latestScanInfo.completedAt,
        coinsScanned: latestScanInfo.coinsScanned,
      },
    },
    {
      status: overallStatus === 'outage' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
