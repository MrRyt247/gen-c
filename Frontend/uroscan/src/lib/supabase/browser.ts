import { createBrowserClient, isBrowser } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '$lib/config';

/**
 * Browser-side Supabase client. Returns `null` in demo mode (no env configured),
 * letting callers fall back to mock data without scattering null-checks everywhere.
 */
export function createSupabaseBrowserClient(): SupabaseClient | null {
	if (!isSupabaseConfigured) return null;

	return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		global: {
			fetch: (...args) => fetch(...args)
		},
		cookies: {
			getAll() {
				if (!isBrowser()) return [];
				return document.cookie
					.split('; ')
					.filter(Boolean)
					.map((c) => {
						const [name, ...rest] = c.split('=');
						return { name, value: rest.join('=') };
					});
			},
			setAll(cookiesToSet) {
				if (!isBrowser()) return;
				for (const { name, value, options } of cookiesToSet) {
					let cookie = `${name}=${encodeURIComponent(value)}`;
					if (options?.maxAge != null) cookie += `; Max-Age=${options.maxAge}`;
					if (options?.path) cookie += `; Path=${options.path}`;
					if (options?.domain) cookie += `; Domain=${options.domain}`;
					if (options?.sameSite) cookie += `; SameSite=${String(options.sameSite)}`;
					if (options?.secure) cookie += `; Secure`;
					document.cookie = cookie;
				}
			}
		}
	});
}
