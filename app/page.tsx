import { getEnv } from '@/lib/config/env';
import { telegramFetch } from '@/lib/telegram/bot';
import LandingClient from '@/components/landing/LandingClient';

export const dynamic = 'force-dynamic';

async function getBotProfile() {
  try {
    const env = getEnv();
    if (!env.TELEGRAM_BOT_TOKEN) return null;
    
    const botInfo = await telegramFetch('getMe', {});
    let photoUrl = '';
    
    try {
      const photos = await telegramFetch('getUserProfilePhotos', { user_id: botInfo.id, limit: 1 });
      if (photos && photos.total_count > 0) {
        const fileId = photos.photos[0][0].file_id;
        const fileInfo = await telegramFetch('getFile', { file_id: fileId });
        photoUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;
      }
    } catch (photoErr) {
      console.warn('Could not fetch bot profile photo:', photoErr);
    }

    return {
      first_name: botInfo.first_name || 'METIQ Bot',
      username: botInfo.username || 'MetiqBot',
      photoUrl,
    };
  } catch (err) {
    console.warn('Failed to load bot profile from Telegram API:', err);
    return null;
  }
}

export default async function LandingPage() {
  const env = getEnv();
  const botProfile = await getBotProfile();
  
  // Fetch actual latest report HTML from database to show real live results in the simulator
  let latestReportHtml: string | null = null;
  try {
    const { getDb } = await import('@/lib/database/db');
    const supabase = getDb();
    const { data: latestScan } = await supabase
      .from('scans')
      .select('report_html')
      .eq('status', 'completed')
      .order('started_at', { ascending: false })
      .limit(1);
    
    latestReportHtml = latestScan?.[0]?.report_html || null;
  } catch (dbErr) {
    console.warn('Could not load latest report for landing simulator:', dbErr);
  }

  const botUsername = botProfile?.username || env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'MetiqBot';
  const telegramUrl = `https://t.me/${botUsername}`;

  return (
    <LandingClient 
      botProfile={botProfile} 
      telegramUrl={telegramUrl}
      latestReportHtml={latestReportHtml}
    />
  );
}
