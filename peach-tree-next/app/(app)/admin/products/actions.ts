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

export type ProductInput = {
  name: string;
  slug: string;
  productVersion: string;
  description: string;
  category: string;
  price: number;
  tags: string[];
  upsellProductIds: number[];
  youtubeUrl: string | null;
  isFeatured: boolean;
  mainFilePath: string;       // already uploaded, private "products" bucket
  coverImageUrl: string | null;   // already uploaded, public "product-images" bucket
  mediaUrls: string[];             // already uploaded, public "product-images" bucket
};

// This function only ever receives small text/JSON — all file bytes were already
// uploaded directly from the browser to Supabase Storage before this is called.
export async function createProduct(input: ProductInput) {
  await assertAdmin();

  if (!input.name || !input.slug || input.price <= 0 || !input.mainFilePath) {
    redirect('/admin/products/new?error=' + encodeURIComponent('Name, slug, a price above $0, and a product file are required.'));
  }

  const admin = supabaseAdmin();
  const { data: maxRow } = await admin.from('products').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { error } = await admin.from('products').insert({
    slug: input.slug,
    name: input.name,
    product_version: input.productVersion || '1.0',
    description: input.description,
    category: input.category,
    price_cents: Math.round(input.price * 100),
    storage_path: input.mainFilePath,
    cover_image_url: input.coverImageUrl,
    media_urls: input.mediaUrls,
    tags: input.tags,
    upsell_product_ids: input.upsellProductIds,
    youtube_url: input.youtubeUrl,
    is_featured: input.isFeatured,
    sort_order: nextOrder,
  });

  if (error) {
    redirect('/admin/products/new?error=' + encodeURIComponent(
      error.message.includes('duplicate') ? 'That slug is already in use.' : error.message
    ));
  }
  redirect('/admin/products?success=1');
}

export type ProductUpdateInput = Omit<ProductInput, 'mainFilePath' | 'coverImageUrl' | 'mediaUrls'> & {
  id: number;
  isActive: boolean;
  mainFilePath: string | null;     // null = keep existing file
  coverImageUrl: string | null;    // null = keep existing
  newMediaUrls: string[];          // appended to existing media
};

export async function updateProduct(input: ProductUpdateInput) {
  await assertAdmin();

  if (!input.name || !input.slug || input.price <= 0) {
    redirect(`/admin/products/${input.id}/edit?error=` + encodeURIComponent('Name, slug, and a price above $0 are required.'));
  }

  const admin = supabaseAdmin();
  const update: Record<string, any> = {
    name: input.name,
    slug: input.slug,
    product_version: input.productVersion || '1.0',
    description: input.description,
    category: input.category,
    price_cents: Math.round(input.price * 100),
    tags: input.tags,
    upsell_product_ids: input.upsellProductIds,
    youtube_url: input.youtubeUrl,
    is_active: input.isActive,
    is_featured: input.isFeatured,
  };
  if (input.mainFilePath) update.storage_path = input.mainFilePath;
  if (input.coverImageUrl) update.cover_image_url = input.coverImageUrl;

  if (input.newMediaUrls.length > 0) {
    const { data: existing } = await admin.from('products').select('media_urls').eq('id', input.id).single();
    update.media_urls = [...(existing?.media_urls ?? []), ...input.newMediaUrls];
  }

  const { error } = await admin.from('products').update(update).eq('id', input.id);
  if (error) redirect(`/admin/products/${input.id}/edit?error=` + encodeURIComponent(error.message));
  redirect('/admin/products?success=1');
}

export async function reorderProducts(orderedIds: number[]) {
  await assertAdmin();
  const admin = supabaseAdmin();
  // Each product's sort_order becomes its position in the list the admin just arranged.
  await Promise.all(orderedIds.map((id, index) => admin.from('products').update({ sort_order: index }).eq('id', id)));
}
