import { fail, redirect } from '@sveltejs/kit';
import { DEMO_COOKIE, isSupabaseConfigured } from '$lib/config';
import type { Actions, PageServerLoad } from './$types';

function safeRedirect(target: string | null): string {
	return target && target.startsWith('/') && !target.startsWith('//') ? target : '/dashboard';
}

export const load: PageServerLoad = async () => {
	return { demo: !isSupabaseConfigured };
};

export const actions: Actions = {
	default: async ({ request, cookies, url, locals }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const password = String(data.get('password') ?? '');
		const redirectTo = safeRedirect(url.searchParams.get('redirectTo'));

		if (!isSupabaseConfigured) {
			// Demo mode: skip real signup and drop straight into the seeded account.
			cookies.set(DEMO_COOKIE, '1', { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
			redirect(303, redirectTo);
		}

		if (password.length < 8) {
			return fail(400, { error: 'Use at least 8 characters for your password.', name, email });
		}

		const { data: result, error } = await locals.supabase!.auth.signUp({
			email,
			password,
			options: {
				data: { full_name: name },
				emailRedirectTo: `${url.origin}/auth/callback`
			}
		});
		if (error) return fail(400, { error: error.message, name, email });

		// With email confirmation off, a session is returned and we can go straight in.
		if (result.session) redirect(303, redirectTo);

		// Otherwise the user must confirm via the email Supabase just sent.
		return { pending: true, email };
	}
};
