import { env } from '$env/dynamic/public';

/**
 * Public Supabase config, read at runtime so the app can boot with the vars absent.
 * When either value is missing we fall back to DEMO MODE — seeded mock data, fake auth —
 * so the whole app is explorable without a backend.
 */
export const SUPABASE_URL = env.PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = env.PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Cookie used to keep a demo session when Supabase isn't configured. */
export const DEMO_COOKIE = 'uroscan-demo';
