/** @type {import('next').NextConfig} */

// Pull the Supabase project hostname straight from the env so image optimization
// is allowed to fetch/resize product images hosted there.
let supabaseHostname = null;
try {
  supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').hostname;
} catch {}

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '60mb',
    },
  },
  images: {
    remotePatterns: [
      ...(supabaseHostname ? [{ protocol: 'https', hostname: supabaseHostname }] : []),
      { protocol: 'https', hostname: '*.supabase.co' }, // fallback in case the env var isn't set at build time
    ],
    formats: ['image/avif', 'image/webp'],
  },
};
module.exports = nextConfig;
