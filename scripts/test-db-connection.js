const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
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
  }
}

async function run() {
  loadEnv();
  
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('SUPABASE_URL:', url);
  console.log('SUPABASE_SERVICE_ROLE_KEY length:', key ? key.length : 0);

  if (!url || !key) {
    console.error('❌ Missing database credentials in .env.local');
    return;
  }

  const supabase = createClient(url, key);

  console.log('Testing connection to table "scans"...');
  const { data: scansData, error: scansError } = await supabase.from('scans').select('id').limit(1);
  if (scansError) {
    console.error('❌ scans table error:', scansError);
  } else {
    console.log('✅ scans table success:', scansData);
  }

  console.log('Testing connection to table "subscribers"...');
  const { data: subsData, error: subsError } = await supabase.from('subscribers').select('chat_id').limit(1);
  if (subsError) {
    console.error('❌ subscribers table error:', subsError);
  } else {
    console.log('✅ subscribers table success:', subsData);
  }
}

run();
