import { redirect } from '@sveltejs/kit';
import { DEMO_COOKIE, isSupabaseConfigured } from '$lib/config';
import type { Actions } from './$types';

export const actions: Actions = {
	signout: async ({ cookies, locals }) => {
		if (isSupabaseConfigured) await locals.supabase?.auth.signOut();
		else cookies.delete(DEMO_COOKIE, { path: '/' });
		redirect(303, '/auth/signin');
	}
};
