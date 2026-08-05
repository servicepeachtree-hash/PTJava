import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(_req: Request, { params }: { params: { productId: string } }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Not logged in.', { status: 401 });

  const productId = Number(params.productId);
  if (!productId) return new NextResponse('Missing product.', { status: 400 });

  // The only question that matters: does this logged-in user own this product?
  // Checked again here even though RLS also protects it — belt and suspenders.
  const { data: entitlement } = await supabase
    .from('entitlements')
    .select('id, product:products(storage_path, name)')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .eq('revoked', false)
    .single();

  if (!entitlement || !entitlement.product) {
    return new NextResponse('You do not have access to this file.', { status: 403 });
  }

  // Signed URL generation requires the service role (the "products" bucket is private)
  const admin = supabaseAdmin();
  const { data: signed, error } = await admin.storage
    .from('products')
    .createSignedUrl((entitlement.product as any).storage_path, 60); // valid for 60 seconds

  if (error || !signed) {
    return new NextResponse('File not found — contact support.', { status: 404 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
