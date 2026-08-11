import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';

/** Redirects non-owners to the one section every admin can see, instead of a dead end. */
export async function requireOwner() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('is_owner').eq('id', user.id).single();
  if (!profile?.is_owner) redirect('/admin/products');
}
