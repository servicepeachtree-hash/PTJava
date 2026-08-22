'use server';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export async function submitReview(formData: FormData) {
  const productId = Number(formData.get('product_id'));
  const rating = Number(formData.get('rating'));
  const body = String(formData.get('body') || '').trim();
  const slug = String(formData.get('slug') || '');

  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  if (rating < 1 || rating > 5 || !body) {
    redirect(`/store/${slug}?review_error=` + encodeURIComponent('A rating and a review are both required.'));
  }

  // Only people who actually own the product can review it.
  const { data: entitlement } = await supabase
    .from('entitlements')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .eq('revoked', false)
    .maybeSingle();

  if (!entitlement) {
    redirect(`/store/${slug}?review_error=` + encodeURIComponent('Only customers who own this product can review it.'));
  }

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('product_id', productId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from('reviews').update({ rating, body }).eq('id', existing.id);
  } else {
    await supabase.from('reviews').insert({ product_id: productId, user_id: user.id, rating, body });
  }

  redirect(`/store/${slug}?reviewed=1`);
}
