import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getEnv } from '@/lib/config/env';
import { getDb } from '@/lib/database/db';
import { runScan } from '@/lib/scanning/runner';
import { sendTelegramMessage, editTelegramMessage, answerCallbackQuery, escapeHtml } from '@/lib/telegram/bot';
import { formatUtcDate } from '@/lib/reports/formatter';
import { cacheGet, cacheSet } from '@/lib/database/redis';

export const dynamic = 'force-dynamic';

// Timing-safe secret comparison
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Generate the inline keyboard
function getStartKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🔍 Scan Meta', callback_data: 'scan_meta' },
        { text: '📊 Latest Report', callback_data: 'latest_report' },
      ],
      [
        { text: '🔔 Alerts Info', callback_data: 'alerts_info' },
        { text: '❓ Help', callback_data: 'help_info' },
      ],
    ],
  };
}

export async function POST(req: NextRequest) {
  const env = getEnv();
  const webhookSecret = env.TELEGRAM_WEBHOOK_SECRET;

  // 1. Validate Secret Token Header
  const requestSecret = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (!requestSecret || !safeCompare(requestSecret, webhookSecret)) {
    console.warn('Unauthorized webhook request rejected (invalid secret header).');
    return new Response('Unauthorized', { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (err: any) {
    console.error('Failed to parse webhook JSON body:', err);
    return new Response('Bad Request', { status: 400 });
  }

  // Log Request ID without private message content
  const updateId = body.update_id;
  console.log(`Processing Telegram Webhook update_id: ${updateId}`);

  try {
    const supabase = getDb();

    // Check if it is a callback query (inline button press)
    if (body.callback_query) {
      const cbQuery = body.callback_query;
      const callbackQueryId = cbQuery.id;
      const data = cbQuery.data;
      const chatId = String(cbQuery.message?.chat?.id);
      const messageId = cbQuery.message?.message_id;

      if (!chatId || !messageId) {
        return new Response('OK');
      }

      await handleCallbackQuery(callbackQueryId, data, chatId, messageId, supabase);
      return new Response('OK');
    }

    // Check if it is a standard message
    if (body.message) {
      const message = body.message;
      const chatId = String(message.chat?.id);
      const text = message.text?.trim() || '';

      if (!chatId || !text) {
        return new Response('OK');
      }

      await handleMessage(chatId, text, supabase);
    }
  } catch (err: any) {
    console.error(`Error processing update_id ${updateId}:`, err);
    // Never fail with 500 to Telegram (otherwise Telegram retries)
  }

  return new Response('OK');
}

/**
 * Handle standard text commands.
 */
async function handleMessage(chatId: string, text: string, supabase: any) {
  const normalizedText = text.toLowerCase().split(' ')[0]; // Extract command part (e.g. /start@MetiqBot -> /start)
  const command = normalizedText.split('@')[0];

  switch (command) {
    case '/start': {
      // Welcome user, explain METIQ, automatically subscribe the chat
      await supabase.from('subscribers').upsert({
        chat_id: chatId,
        is_active: true,
        updated_at: new Date().toISOString(),
      });

      const welcome = `<b>Welcome to METIQ - Crypto Meta Intelligence</b>\n\n` +
        `Detect emerging crypto narratives before they become obvious.\n` +
        `METIQ automatically scans decentralized markets every six hours and delivers reports directly to you.\n\n` +
        `<i>Your chat is now subscribed to the automatic six-hour reports.</i>`;

      await sendTelegramMessage(chatId, welcome, { reply_markup: getStartKeyboard() });
      break;
    }

    case '/meta': {
      // Run a fresh market scan
      const sentMsg = await sendTelegramMessage(chatId, '🔍 <i>Scanning DexScreener market data for emerging narratives...</i>');
      const messageId = sentMsg.message_id;

      try {
        const result = await runScan('manual');
        
        if (result.status === 'cooldown') {
          const dateStr = result.completedAt ? formatUtcDate(result.completedAt) : 'recently';
          const cooldownMsg = `⚠️ <b>Scan Cooldown Active</b>\n\n` +
            `To prevent DexScreener API rate limits, manual scans are limited. Here is the latest report from ${dateStr} (cooldown expires in ${result.cooldownRemainingSeconds}s):\n\n` +
            `${result.reportHtml}`;
          await editTelegramMessage(chatId, messageId, cooldownMsg);
        } else if (result.status === 'running') {
          const runningMsg = `⏳ <b>Scan in Progress</b>\n\n` +
            `Another scanning process is already running. Here is the latest completed report:\n\n` +
            `${result.reportHtml}`;
          await editTelegramMessage(chatId, messageId, runningMsg);
        } else {
          await editTelegramMessage(chatId, messageId, result.reportHtml || 'Scan completed successfully.');
        }
      } catch (err: any) {
        console.error('Scan command failed:', err);
        const errorMsg = `❌ <b>Scan Failed</b>\n\n` +
          `Failed to complete the market scan. ${escapeHtml(err.message || 'Please try again later.')}`;
        await editTelegramMessage(chatId, messageId, errorMsg);
      }
      break;
    }

    case '/latest': {
      // Check cache first
      const cachedReport = await cacheGet<string>('metiq:latest_report');
      if (cachedReport) {
        console.log('🔌 Serving latest report from Redis cache...');
        await sendTelegramMessage(chatId, cachedReport);
        break;
      }

      // Fallback to database
      const { data: latestScan } = await supabase
        .from('scans')
        .select('report_html')
        .eq('status', 'completed')
        .order('started_at', { ascending: false })
        .limit(1);

      if (latestScan && latestScan.length > 0 && latestScan[0].report_html) {
        const report = latestScan[0].report_html;
        await sendTelegramMessage(chatId, report);
        // Cache in Redis for subsequent requests
        await cacheSet('metiq:latest_report', report, 300);
      } else {
        await sendTelegramMessage(chatId, '📭 <i>No reports stored yet. Run /meta to execute a fresh scan.</i>');
      }
      break;
    }

    case '/subscribe': {
      // Enable alerts
      await supabase.from('subscribers').upsert({
        chat_id: chatId,
        is_active: true,
        updated_at: new Date().toISOString(),
      });

      const subscribeMsg = `🔔 <b>METIQ Alerts Enabled</b>\n\n` +
        `This chat will receive automatic reports every six hours (00:00, 06:00, 12:00, 18:00 UTC).\n` +
        `Use /unsubscribe to stop alerts at any time.`;

      await sendTelegramMessage(chatId, subscribeMsg);
      break;
    }

    case '/unsubscribe': {
      // Disable alerts
      await supabase
        .from('subscribers')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('chat_id', chatId);

      const unsubscribeMsg = `🔕 <b>METIQ Alerts Disabled</b>\n\n` +
        `You have unsubscribed from automatic reports. Manual commands like /meta and /latest remain fully functional.\n` +
        `Use /subscribe to re-enable alerts.`;

      await sendTelegramMessage(chatId, unsubscribeMsg);
      break;
    }

    case '/status': {
      // Get subscriber count and latest scan information
      const { count: activeSubscribers } = await supabase
        .from('subscribers')
        .select('chat_id', { count: 'exact', head: true })
        .eq('is_active', true);

      const { data: latestScan } = await supabase
        .from('scans')
        .select('completed_at, sources')
        .eq('status', 'completed')
        .order('started_at', { ascending: false })
        .limit(1);

      // Next scheduled scan calculations (UTC target: 00:00, 06:00, 12:00, 18:00)
      const now = new Date();
      const currentHour = now.getUTCHours();
      let nextHour = 0;
      if (currentHour < 6) nextHour = 6;
      else if (currentHour < 12) nextHour = 12;
      else if (currentHour < 18) nextHour = 18;
      else nextHour = 24;

      const nextScanDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), nextHour === 24 ? 0 : nextHour, 0, 0));
      if (nextHour === 24) {
        nextScanDate.setUTCDate(nextScanDate.getUTCDate() + 1);
      }

      const dexscreenerStatus = latestScan?.[0]?.sources?.status || 'operational';
      const lastScanTime = latestScan?.[0]?.completed_at ? formatUtcDate(new Date(latestScan[0].completed_at)) : 'N/A';

      const statusMsg = `📊 <b>METIQ System Status</b>\n\n` +
        `• Bot API: Operational\n` +
        `• DexScreener: ${escapeHtml(dexscreenerStatus.toUpperCase())}\n` +
        `• Database: Operational\n` +
        `• Last Scan: ${lastScanTime}\n` +
        `• Next Scheduled Scan: ${formatUtcDate(nextScanDate)}\n\n` +
        `• Active Report Subscribers: <b>${activeSubscribers || 0}</b>\n\n` +
        `<i>Private chat parameters are redacted for privacy.</i>`;

      await sendTelegramMessage(chatId, statusMsg);
      break;
    }

    case '/help': {
      // Explain commands
      const helpMsg = `❓ <b>METIQ Bot Help & Commands</b>\n\n` +
        `/meta - Run a fresh narrative scan (with a cooldown limitation).\n` +
        `/latest - Get the latest completed report immediately without scanning.\n` +
        `/subscribe - Enable automatic reports every six hours.\n` +
        `/unsubscribe - Disable automatic reports.\n` +
        `/status - View service connectivity and subscriber counts.\n` +
        `/help - Show this instructions page.`;

      await sendTelegramMessage(chatId, helpMsg);
      break;
    }

    default:
      // Silently ignore or answer unrecognized messages
      break;
  }
}

/**
 * Handle inline button callback queries.
 */
async function handleCallbackQuery(
  callbackQueryId: string,
  data: string,
  chatId: string,
  messageId: number,
  supabase: any
) {
  // Acknowledge the callback query so the loading wheel stops spinning
  await answerCallbackQuery(callbackQueryId);

  switch (data) {
    case 'scan_meta': {
      // Trigger a manual /meta command logic
      await handleMessage(chatId, '/meta', supabase);
      break;
    }

    case 'latest_report': {
      // Fetch latest completed report
      const { data: latestScan } = await supabase
        .from('scans')
        .select('report_html')
        .eq('status', 'completed')
        .order('started_at', { ascending: false })
        .limit(1);

      if (latestScan && latestScan.length > 0 && latestScan[0].report_html) {
        await sendTelegramMessage(chatId, latestScan[0].report_html);
      } else {
        await sendTelegramMessage(chatId, '📭 <i>No reports stored yet. Use Scan Meta to execute a scan.</i>');
      }
      break;
    }

    case 'alerts_info': {
      // Check current subscription status
      const { data: sub } = await supabase
        .from('subscribers')
        .select('is_active')
        .eq('chat_id', chatId)
        .limit(1);

      const isActive = sub && sub.length > 0 && sub[0].is_active;

      let msg = '';
      if (isActive) {
        msg = `🔔 <b>Alerts Status: ACTIVE</b>\n\nYou will receive automatic meta report updates every six hours (00:00, 06:00, 12:00, 18:00 UTC).\n\nUse /unsubscribe to stop reports.`;
      } else {
        msg = `🔕 <b>Alerts Status: INACTIVE</b>\n\nYou are currently not receiving automatic reports.\n\nUse /subscribe to enable alerts.`;
      }

      await sendTelegramMessage(chatId, msg);
      break;
    }

    case 'help_info': {
      // Run /help command
      await handleMessage(chatId, '/help', supabase);
      break;
    }

    default:
      break;
  }
}
