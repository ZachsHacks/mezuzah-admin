import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key (bypasses RLS)
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

export const BUCKET = 'mezuzah-images';

export function getPublicUrl(path: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${url}/storage/v1/object/public/${BUCKET}/${path}`;
}
