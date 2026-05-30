import { fail, redirect } from '@sveltejs/kit';
import { DEMO_COOKIE, isSupabaseConfigured } from '$lib/config';
import { DEMO_USER } from '$lib/server/demo';
import type { Actions, PageServerLoad } from './$types';

/** Surface the seeded account to prefill the form when running without a backend. */
export const load: PageServerLoad = async () => {
	return {
		demo: isSupabaseConfigured ? null : { email: DEMO_USER.email, name: DEMO_USER.name }
	};
};

/** Only allow same-origin path redirects (guards against open-redirect). */
function safeRedirect(target: string | null): string {
	return target && target.startsWith('/') && !target.startsWith('//') ? target : '/dashboard';
}

export const actions: Actions = {
	default: async ({ request, cookies, url, locals }) => {
		const form = await request.formData();
		const redirectTo = safeRedirect(url.searchParams.get('redirectTo'));

		if (isSupabaseConfigured) {
			const email = String(form.get('email') ?? '');
			const password = String(form.get('password') ?? '');
			const { error } = await locals.supabase!.auth.signInWithPassword({ email, password });
			if (error) return fail(400, { error: error.message, email });
		} else {
			// Demo mode: presence of the cookie is the whole session.
			cookies.set(DEMO_COOKIE, '1', {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 30
			});
		}

		redirect(303, redirectTo);
	}
};
