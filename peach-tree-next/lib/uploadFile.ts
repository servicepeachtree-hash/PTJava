'use client';
import { supabaseBrowser } from './supabase/client';
import { getUploadSlot, getPublicUrl } from '@/app/(app)/admin/products/upload-actions';

export async function uploadFileDirect(
  bucket: 'products' | 'product-images',
  file: File
): Promise<{ path: string; publicUrl: string | null }> {
  const slot = await getUploadSlot(bucket, file.name);
  const supabase = supabaseBrowser();
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(slot.path, slot.token, file);
  if (error) throw new Error(`Upload of "${file.name}" failed: ${error.message}`);

  let publicUrl: string | null = null;
  if (bucket === 'product-images') {
    publicUrl = await getPublicUrl(bucket, slot.path);
  }
  return { path: slot.path, publicUrl };
}
