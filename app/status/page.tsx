import { getDb } from '@/lib/database/db';
import StatusClient from '@/components/status/StatusClient';

export const dynamic = 'force-dynamic';

async function fetchRecentScans() {
  try {
    const supabase = getDb();
    const { data, error } = await supabase
      .from('scans')
      .select('id, status, started_at, completed_at, coins_scanned')
      .order('started_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Supabase query error loading scans for status:', error);
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.error('Failed to load initial scans in server page:', err.message);
    return [];
  }
}

export default async function StatusPage() {
  const initialScans = await fetchRecentScans();
  return <StatusClient initialScans={initialScans} />;
}
