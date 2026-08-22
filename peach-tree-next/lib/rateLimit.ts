import { supabaseAdmin } from './supabase/admin';

export type RateLimitResult = { allowed: boolean; retryAfterSeconds?: number };

/**
 * Fixed-window rate limiting. `key` should already include the action name and
 * identifier, e.g. `login:203.0.113.4`, so different actions don't share a bucket.
 */
export async function checkRateLimit(key: string, maxAttempts: number, windowSeconds: number): Promise<RateLimitResult> {
  const admin = supabaseAdmin();
  const now = Date.now();

  const { data: existing } = await admin.from('rate_limits').select('*').eq('key', key).maybeSingle();

  if (!existing) {
    await admin.from('rate_limits').upsert({ key, count: 1, window_start: new Date(now).toISOString() });
    return { allowed: true };
  }

  const windowStartMs = new Date(existing.window_start).getTime();
  const elapsedSeconds = (now - windowStartMs) / 1000;

  if (elapsedSeconds > windowSeconds) {
    // Window expired — start a fresh one.
    await admin.from('rate_limits').update({ count: 1, window_start: new Date(now).toISOString() }).eq('key', key);
    return { allowed: true };
  }

  if (existing.count >= maxAttempts) {
    return { allowed: false, retryAfterSeconds: Math.ceil(windowSeconds - elapsedSeconds) };
  }

  await admin.from('rate_limits').update({ count: existing.count + 1 }).eq('key', key);
  return { allowed: true };
}
