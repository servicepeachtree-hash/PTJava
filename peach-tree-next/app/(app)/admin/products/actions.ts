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

function safeFileName(name: string) {
  return randomBytes(8).toString('hex') + '_' + name.replace(/[^A-Za-z0-9._-]/g, '_');
}

export async function createProduct(formData: FormData) {
  await assertAdmin();

  const name = String(formData.get('name') || '').trim();
  const slug = String(formData.get('slug') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const category = String(formData.get('category') || 'uncategorized').trim();
  const price = Number(formData.get('price') || 0);
  const tags = String(formData.get('tags') || '').split(',').map((t) => t.trim()).filter(Boolean);
  const upsellRaw = String(formData.get('upsell_product_id') || '');
  const upsellProductId = upsellRaw ? Number(upsellRaw) : null;
  const youtubeUrl = String(formData.get('youtube_url') || '').trim() || null;

  const file = formData.get('file') as File | null;
  const coverImage = formData.get('cover_image') as File | null;
  const schematic = formData.get('schematic') as File | null;
  const mediaFiles = formData.getAll('media') as File[];

  if (!name || !slug || price <= 0 || !file || file.size === 0) {
    redirect('/admin/products/new?error=' + encodeURIComponent('Name, slug, a price above $0, and a product file are required.'));
  }

  const admin = supabaseAdmin();

  const mainName = safeFileName(file.name);
  const { error: uploadErr } = await admin.storage.from('products').upload(mainName, await file.arrayBuffer(), { contentType: file.type || 'application/octet-stream' });
  if (uploadErr) redirect('/admin/products/new?error=' + encodeURIComponent('Product file upload failed: ' + uploadErr.message));

  let coverImageUrl: string | null = null;
  if (coverImage && coverImage.size > 0) {
    const coverName = safeFileName(coverImage.name);
    const { error } = await admin.storage.from('product-images').upload(coverName, await coverImage.arrayBuffer(), { contentType: coverImage.type || 'image/jpeg' });
    if (!error) coverImageUrl = admin.storage.from('product-images').getPublicUrl(coverName).data.publicUrl;
  }

  let schematicPath: string | null = null;
  if (schematic && schematic.size > 0) {
    const schemName = safeFileName(schematic.name);
    const { error } = await admin.storage.from('products').upload(schemName, await schematic.arrayBuffer(), { contentType: 'application/octet-stream' });
    if (!error) schematicPath = schemName;
  }

  const mediaUrls: string[] = [];
  for (const m of mediaFiles) {
    if (!m || m.size === 0) continue;
    const mName = safeFileName(m.name);
    const { error } = await admin.storage.from('product-images').upload(mName, await m.arrayBuffer(), { contentType: m.type || 'image/jpeg' });
    if (!error) mediaUrls.push(admin.storage.from('product-images').getPublicUrl(mName).data.publicUrl);
  }

  const { error: insertErr } = await admin.from('products').insert({
    slug, name, description, category,
    price_cents: Math.round(price * 100),
    storage_path: mainName,
    cover_image_url: coverImageUrl,
    schematic_path: schematicPath,
    media_urls: mediaUrls,
    tags,
    upsell_product_id: upsellProductId,
    youtube_url: youtubeUrl,
  });

  if (insertErr) redirect('/admin/products/new?error=' + encodeURIComponent('Save failed: ' + insertErr.message));
  redirect('/admin/products?success=1');
}

export async function updateProduct(formData: FormData) {
  await assertAdmin();

  const id = Number(formData.get('id'));
  const name = String(formData.get('name') || '').trim();
  const slug = String(formData.get('slug') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const category = String(formData.get('category') || 'uncategorized').trim();
  const price = Number(formData.get('price') || 0);
  const tags = String(formData.get('tags') || '').split(',').map((t) => t.trim()).filter(Boolean);
  const upsellRaw = String(formData.get('upsell_product_id') || '');
  const upsellProductId = upsellRaw ? Number(upsellRaw) : null;
  const youtubeUrl = String(formData.get('youtube_url') || '').trim() || null;
  const isActive = formData.get('is_active') === 'on';

  if (!name || !slug || price <= 0) {
    redirect(`/admin/products/${id}/edit?error=` + encodeURIComponent('Name, slug, and a price above $0 are required.'));
  }

  const admin = supabaseAdmin();
  const update: Record<string, any> = {
    name, slug, description, category,
    price_cents: Math.round(price * 100),
    tags, upsell_product_id: upsellProductId, youtube_url: youtubeUrl,
    is_active: isActive,
  };

  const file = formData.get('file') as File | null;
  if (file && file.size > 0) {
    const mainName = safeFileName(file.name);
    const { error } = await admin.storage.from('products').upload(mainName, await file.arrayBuffer(), { contentType: file.type || 'application/octet-stream' });
    if (!error) update.storage_path = mainName;
  }

  const coverImage = formData.get('cover_image') as File | null;
  if (coverImage && coverImage.size > 0) {
    const coverName = safeFileName(coverImage.name);
    const { error } = await admin.storage.from('product-images').upload(coverName, await coverImage.arrayBuffer(), { contentType: coverImage.type || 'image/jpeg' });
    if (!error) update.cover_image_url = admin.storage.from('product-images').getPublicUrl(coverName).data.publicUrl;
  }

  const schematic = formData.get('schematic') as File | null;
  if (schematic && schematic.size > 0) {
    const schemName = safeFileName(schematic.name);
    const { error } = await admin.storage.from('products').upload(schemName, await schematic.arrayBuffer(), { contentType: 'application/octet-stream' });
    if (!error) update.schematic_path = schemName;
  }

  const mediaFiles = formData.getAll('media') as File[];
  const newMediaUrls: string[] = [];
  for (const m of mediaFiles) {
    if (!m || m.size === 0) continue;
    const mName = safeFileName(m.name);
    const { error } = await admin.storage.from('product-images').upload(mName, await m.arrayBuffer(), { contentType: m.type || 'image/jpeg' });
    if (!error) newMediaUrls.push(admin.storage.from('product-images').getPublicUrl(mName).data.publicUrl);
  }
  if (newMediaUrls.length > 0) {
    const { data: existing } = await admin.from('products').select('media_urls').eq('id', id).single();
    update.media_urls = [...(existing?.media_urls ?? []), ...newMediaUrls];
  }

  const { error: updateErr } = await admin.from('products').update(update).eq('id', id);
  if (updateErr) redirect(`/admin/products/${id}/edit?error=` + encodeURIComponent(updateErr.message));
  redirect('/admin/products?success=1');
}
