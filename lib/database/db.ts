import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../config/env';

let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getDb(): any {
  if (supabaseClient) return supabaseClient;

  const env = getEnv();

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase URL or Service Role Key is missing. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured.');
  }

  // Set up the client using the service role key to bypass Row-Level Security (RLS) on the server.
  // We disable persistence and token refresh for a clean serverless environment.
  supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
}
