import { isSupabaseConfigured } from '$lib/config';
import type { LayoutServerLoad } from './$types';

/** Expose the resolved session/user (set in hooks) and the runtime mode to the client. */
export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user,
		session: locals.session,
		isSupabaseConfigured
	};
};
