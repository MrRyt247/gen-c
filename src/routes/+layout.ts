import { createSupabaseBrowserClient } from '$lib/supabase/browser';
import type { LayoutLoad } from './$types';

/** Create the browser Supabase client once and pass it (with session/user) down the tree. */
export const load: LayoutLoad = async ({ data, depends }) => {
	depends('supabase:auth');

	const supabase = createSupabaseBrowserClient();

	return {
		supabase,
		user: data.user,
		session: data.session,
		isSupabaseConfigured: data.isSupabaseConfigured
	};
};
