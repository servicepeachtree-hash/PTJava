'use server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/** Only issues a preview link if the current user actually owns this product. */
export async function getOwnedPreviewUrl(productId: number, path: string): Promise<string> {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in.');

  const { data: entitlement } = await supabase
    .from('entitlements')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .eq('revoked', false)
    .maybeSingle();

  if (!entitlement) throw new Error('You do not have access to this file.');

  const admin = supabaseAdmin();
  const { data, error } = await admin.storage.from('products').createSignedUrl(path, 120);
  if (error || !data) throw new Error('Could not create a preview link.');
  return data.signedUrl;
}
