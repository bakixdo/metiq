import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getEnv } from '@/lib/config/env';
import { getDb } from '@/lib/database/db';
import { runScan } from '@/lib/scanning/runner';
import { sendTelegramMessage } from '@/lib/telegram/bot';

export const dynamic = 'force-dynamic';

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(req: NextRequest) {
  const env = getEnv();
  const cronSecret = env.CRON_SECRET;

  // 1. Authenticate Request using Timing-Safe Secrets
  const authHeader = req.headers.get('Authorization');
  const querySecret = req.nextUrl.searchParams.get('secret');

  let providedSecret = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedSecret = authHeader.substring(7);
  } else if (querySecret) {
    providedSecret = querySecret;
  }

  if (!providedSecret || !safeCompare(providedSecret, cronSecret)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getDb();

  try {
    // 2. Idempotency Check: Prevent duplicate runs if retried within 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentScan } = await supabase
      .from('scans')
      .select('id, completed_at, status, report_html, coins_scanned')
      .eq('trigger', 'cron')
      .eq('status', 'completed')
      .gt('completed_at', fifteenMinutesAgo)
      .limit(1);

    if (recentScan && recentScan.length > 0) {
      return Response.json({
        status: 'skipped',
        message: 'Idempotency check passed: A cron scan was already successfully completed in the last 15 minutes.',
        scanId: recentScan[0].id,
        coinsScanned: recentScan[0].coins_scanned,
      });
    }

    // 3. Trigger Scanner Coordinator
    const result = await runScan('cron');

    if (result.alreadyRunning) {
      return Response.json({
        status: 'running',
        message: 'Scan is already running in another container process.',
        scanId: result.scanId,
      });
    }

    if (result.status === 'failed' || !result.reportHtml) {
      throw new Error('Cron scan execution failed to produce a valid report.');
    }

    const reportHtml = result.reportHtml;

    // 4. Fetch Active Report Subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('subscribers')
      .select('chat_id, delivery_failure_count')
      .eq('is_active', true);

    if (subError) {
      throw new Error(`Failed to query active subscribers: ${subError.message}`);
    }

    const broadcastResults = {
      total: subscribers?.length || 0,
      successCount: 0,
      failedCount: 0,
      deactivatedCount: 0,
    };

    // 5. Deliver Telegram Report Broadcast
    if (subscribers && subscribers.length > 0) {
      const deliveryPromises = subscribers.map(async (sub: any) => {
        try {
          await sendTelegramMessage(sub.chat_id, reportHtml);
          
          // Successful delivery: reset failure counters
          await supabase
            .from('subscribers')
            .update({
              last_delivery_at: new Date().toISOString(),
              delivery_failure_count: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('chat_id', sub.chat_id);
          
          broadcastResults.successCount++;
        } catch (err: any) {
          console.error(`Broadcast failed to chat ID ${sub.chat_id}:`, err.message);
          broadcastResults.failedCount++;

          if (err.isPermanentFailure) {
            // Permanently block/deactivate if subscriber has blocked the bot (forbidden, chat not found)
            await supabase
              .from('subscribers')
              .update({
                is_active: false,
                delivery_failure_count: sub.delivery_failure_count + 1,
                updated_at: new Date().toISOString(),
              })
              .eq('chat_id', sub.chat_id);
            
            broadcastResults.deactivatedCount++;
          } else {
            // Temporary fail: increment counter
            await supabase
              .from('subscribers')
              .update({
                delivery_failure_count: sub.delivery_failure_count + 1,
                updated_at: new Date().toISOString(),
              })
              .eq('chat_id', sub.chat_id);
          }
        }
      });

      // Deliver in parallel, continuing even if individual chats fail
      await Promise.all(deliveryPromises);
    }

    return Response.json({
      status: 'completed',
      scanId: result.scanId,
      coinsScanned: result.coinsScanned,
      broadcast: broadcastResults,
    });
  } catch (err: any) {
    console.error('❌ Scheduled cron scan route failed:', err);
    return Response.json(
      {
        status: 'failed',
        error: err.message || 'Internal scanning error',
      },
      { status: 500 }
    );
  }
}
