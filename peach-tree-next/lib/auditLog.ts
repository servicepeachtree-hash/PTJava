import { supabaseServer } from './supabase/server';
import { supabaseAdmin } from './supabase/admin';

export async function logAdminAction(action: string, target?: string, details?: Record<string, any>) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  await supabaseAdmin().from('admin_audit_log').insert({
    actor_id: user?.id ?? null,
    actor_email: user?.email ?? null,
    action,
    target: target ?? null,
    details: details ?? null,
  });
}
