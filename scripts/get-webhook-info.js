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

  if (!token) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN is not configured.');
    process.exit(1);
  }

  const infoUrl = `https://api.telegram.org/bot${token}/getWebhookInfo`;

  console.log('Querying Telegram Bot API for Webhook Info...');

  try {
    const res = await fetch(infoUrl);
    const data = await res.json();
    if (data.ok) {
      console.log('ℹ️ Current Webhook Configuration details:');
      console.log(JSON.stringify(data.result, null, 2));
    } else {
      console.error('❌ Failed to retrieve Webhook info:');
      console.error(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ Communication failure with Telegram API:', err.message);
  }
}

run();
