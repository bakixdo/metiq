import { getEnv } from '../config/env';

/**
 * Escapes characters for Telegram HTML mode.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Splits a text message safely into chunks under the Telegram 4096 character limit.
 * Tries to split on narrative or line boundaries.
 */
export function splitMessage(text: string, maxLength = 4000): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  const lines = text.split('\n');
  let currentChunk = '';

  for (const line of lines) {
    if ((currentChunk + '\n' + line).length > maxLength) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = line;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n' + line : line;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Executes a call to the Telegram Bot API.
 */
export async function telegramFetch(method: string, body: any): Promise<any> {
  const env = getEnv();
  const token = env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error('Telegram Bot Token is not configured.');
  }

  const url = `https://api.telegram.org/bot${token}/${method}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.ok) {
    const errorMsg = data.description || `Telegram API error code ${data.error_code}`;
    const isPermanent = 
      res.status === 403 || 
      errorMsg.includes('blocked') || 
      errorMsg.includes('deactivated') || 
      errorMsg.includes('chat not found') || 
      errorMsg.includes('Forbidden') ||
      errorMsg.includes('kicked');

    const err: any = new Error(errorMsg);
    err.code = data.error_code;
    err.isPermanentFailure = isPermanent;
    throw err;
  }

  return data.result;
}

/**
 * Sends a message to a Telegram chat.
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options: {
    parse_mode?: 'HTML' | 'MarkdownV2';
    disable_web_page_preview?: boolean;
    reply_markup?: any;
  } = {}
): Promise<any> {
  // Set default option to disable link previews
  const disablePreview = options.disable_web_page_preview ?? true;
  
  return telegramFetch('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: options.parse_mode ?? 'HTML',
    disable_web_page_preview: disablePreview,
    reply_markup: options.reply_markup,
  });
}

/**
 * Edits an existing Telegram message.
 */
export async function editTelegramMessage(
  chatId: string,
  messageId: number,
  text: string,
  options: {
    parse_mode?: 'HTML' | 'MarkdownV2';
    disable_web_page_preview?: boolean;
    reply_markup?: any;
  } = {}
): Promise<any> {
  const disablePreview = options.disable_web_page_preview ?? true;

  return telegramFetch('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: options.parse_mode ?? 'HTML',
    disable_web_page_preview: disablePreview,
    reply_markup: options.reply_markup,
  });
}

/**
 * Acknowledges callback query requests.
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  options: {
    text?: string;
    show_alert?: boolean;
  } = {}
): Promise<any> {
  return telegramFetch('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text: options.text,
    show_alert: options.show_alert,
  });
}
