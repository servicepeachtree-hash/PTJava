'use server';
import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';

async function assertAdmin() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user?.id).single();
  if (!profile?.is_admin) redirect('/login');
}

/**
 * Returns a one-time signed upload slot for a specific storage bucket + filename.
 * The actual file bytes never touch this server — the browser uses this token to
 * upload directly to Supabase Storage, which is the only way around Vercel's
 * hard 4.5MB request-body ceiling on serverless functions.
 */
export async function getUploadSlot(bucket: 'products' | 'product-images', originalName: string) {
  await assertAdmin();
  const safeName = randomBytes(8).toString('hex') + '_' + originalName.replace(/[^A-Za-z0-9._-]/g, '_');
  const admin = supabaseAdmin();
  const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(safeName);
  if (error || !data) throw new Error('Could not prepare upload: ' + (error?.message || 'unknown error'));
  return { path: safeName, token: data.token, bucket };
}

export async function getPublicUrl(bucket: 'products' | 'product-images', path: string) {
  const admin = supabaseAdmin();
  return admin.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
