import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured, DEMO_COOKIE } from '$lib/config';
import { DEMO_USER } from '$lib/server/demo';
import type { SessionUser } from '$lib/types';

/** Routes that require an authenticated session. */
const PROTECTED = ['/dashboard', '/scan', '/results', '/trends', '/history', '/profile'];

/**
 * Attach a request-scoped Supabase server client + a `safeGetSession()` helper to `locals`.
 * In demo mode the client is null and the session comes from a signed-in demo cookie.
 */
const supabase: Handle = async ({ event, resolve }) => {
	if (isSupabaseConfigured) {
		event.locals.supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => {
					for (const { name, value, options } of cookiesToSet) {
						event.cookies.set(name, value, { ...options, path: '/' });
					}
				}
			}
		});

		event.locals.safeGetSession = async () => {
			const {
				data: { session }
			} = await event.locals.supabase!.auth.getSession();
			if (!session) return { session: null, user: null };

			// getUser() validates the JWT against the auth server — getSession() alone is spoofable.
			const {
				data: { user },
				error
			} = await event.locals.supabase!.auth.getUser();
			if (error) return { session: null, user: null };

			const sessionUser: SessionUser = {
				id: user!.id,
				email: user!.email ?? '',
				name: (user!.user_metadata?.full_name as string) ?? user!.email?.split('@')[0] ?? 'there'
			};
			return { session, user: sessionUser };
		};
	} else {
		// Demo mode: presence of the demo cookie means "signed in".
		event.locals.supabase = null;
		event.locals.safeGetSession = async () => {
			const signedIn = event.cookies.get(DEMO_COOKIE) === '1';
			return signedIn
				? { session: { demo: true }, user: DEMO_USER }
				: { session: null, user: null };
		};
	}

	return resolve(event, {
		filterSerializedResponseHeaders: (name) => name === 'content-range' || name === 'x-supabase-api-version'
	});
};

/** Guard protected routes; redirect unauthenticated users to sign in. */
const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	const needsAuth = PROTECTED.some((p) => event.url.pathname.startsWith(p));
	if (needsAuth && !user) {
		const redirectTo = encodeURIComponent(event.url.pathname + event.url.search);
		redirect(303, `/auth/signin?redirectTo=${redirectTo}`);
	}

	// Bounce already-signed-in users away from the auth pages.
	if (user && event.url.pathname.startsWith('/auth/sign')) {
		redirect(303, '/dashboard');
	}

	return resolve(event);
};

export const handle = sequence(supabase, authGuard);
