import { createClient } from '@supabase/supabase-js';

/**
 * DANGEROUS if used in the wrong place: this key bypasses Row Level Security
 * completely. Only ever import this file from Route Handlers, Server Actions,
 * or the Stripe webhook — never from a Client Component, never sent to the browser.
 */
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
