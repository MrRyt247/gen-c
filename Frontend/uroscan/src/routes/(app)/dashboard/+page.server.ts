import type { PageServerLoad } from './$types';
import { getRecentTests } from '$lib/data/tests';

export const load: PageServerLoad = async ({ locals }) => {
	const tests = locals.user ? await getRecentTests(locals.supabase, locals.user.id, 6) : [];
	return { tests };
};
