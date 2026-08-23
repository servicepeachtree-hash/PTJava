import { SupabaseClient } from '@supabase/supabase-js';

export async function loadOwnedProductIds(db: SupabaseClient, userId: string | undefined): Promise<Set<number>> {
  if (!userId) return new Set();
  const { data } = await db
    .from('entitlements')
    .select('product_id')
    .eq('user_id', userId)
    .eq('revoked', false);
  return new Set((data ?? []).map((e: any) => e.product_id));
}
