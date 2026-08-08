const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPaths = [
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '../.env')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
          
          if (!process.env[key]) {
            process.env[key] = value.trim();
          }
        }
      });
      console.log(`Loaded environment config from ${path.basename(envPath)}`);
      break;
    }
  }
}

async function run() {
  loadEnv();

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!token) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN is not configured.');
    process.exit(1);
  }
  if (!webhookSecret) {
    console.error('❌ Error: TELEGRAM_WEBHOOK_SECRET is not configured.');
    process.exit(1);
  }
  if (!appUrl) {
    console.error('❌ Error: NEXT_PUBLIC_APP_URL is not configured.');
    process.exit(1);
  }

  const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/telegram/webhook`;

  console.log(`Registering webhook with Telegram Bot API: ${webhookUrl}`);

  const registerUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}&secret_token=${encodeURIComponent(webhookSecret)}`;

  try {
    const res = await fetch(registerUrl);
    const data = await res.json();
    if (data.ok) {
      console.log('✅ Telegram Webhook registered successfully!');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Telegram Webhook registration failed:');
      console.error(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ Communication failure with Telegram API:', err.message);
  }
}

run();
