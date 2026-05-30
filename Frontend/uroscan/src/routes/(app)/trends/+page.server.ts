import type { PageServerLoad } from './$types';
import { getHistoryTests } from '$lib/data/tests';

export const load: PageServerLoad = async ({ locals }) => {
	const tests = locals.user ? await getHistoryTests(locals.supabase, locals.user.id, 0, 50) : [];
	return { tests };
};
