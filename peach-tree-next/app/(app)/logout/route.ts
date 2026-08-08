import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST() {
  const supabase = supabaseServer();
  await supabase.auth.signOut();
  redirect('/login');
}
