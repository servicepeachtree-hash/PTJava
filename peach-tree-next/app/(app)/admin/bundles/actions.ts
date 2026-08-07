'use server';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';

async function assertAdmin() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user?.id).single();
  if (!profile?.is_admin) redirect('/login');
}

export type BundleInput = {
  name: string;
  slug: string;
  description: string;
  productIds: number[];
  discountPercent: number | null;
  coverImageUrl: string | null;
  isActive: boolean;
};

export async function createBundle(input: BundleInput) {
  await assertAdmin();

  if (!input.name || !input.slug || input.productIds.length < 2) {
    redirect('/admin/bundles/new?error=' + encodeURIComponent('Name, slug, and at least 2 products are required.'));
  }

  const admin = supabaseAdmin();
  const { error } = await admin.from('bundles').insert({
    name: input.name,
    slug: input.slug,
    description: input.description,
    product_ids: input.productIds,
    discount_percent: input.discountPercent,
    cover_image_url: input.coverImageUrl,
    is_active: input.isActive,
  });

  if (error) {
    redirect('/admin/bundles/new?error=' + encodeURIComponent(
      error.message.includes('duplicate') ? 'That slug is already in use.' : error.message
    ));
  }
  redirect('/admin/bundles?success=1');
}

export async function updateBundle(id: number, input: BundleInput) {
  await assertAdmin();

  if (!input.name || !input.slug || input.productIds.length < 2) {
    redirect(`/admin/bundles/${id}/edit?error=` + encodeURIComponent('Name, slug, and at least 2 products are required.'));
  }

  const admin = supabaseAdmin();
  const { error } = await admin.from('bundles').update({
    name: input.name,
    slug: input.slug,
    description: input.description,
    product_ids: input.productIds,
    discount_percent: input.discountPercent,
    cover_image_url: input.coverImageUrl,
    is_active: input.isActive,
  }).eq('id', id);

  if (error) redirect(`/admin/bundles/${id}/edit?error=` + encodeURIComponent(error.message));
  redirect('/admin/bundles?success=1');
}
