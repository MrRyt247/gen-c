import type { PageServerLoad } from './$types';
import { getRecentTests, getTestById } from '$lib/data/tests';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { tests: [] };

	const tests = await getRecentTests(locals.supabase, locals.user.id, 6);
	if (!tests.length) return { tests };

	// getRecentTests omits the results relation; fetch the latest in full so the
	// hero card can compute the panel score, badge counts, and hydration nudge.
	const latestFull = await getTestById(locals.supabase, locals.user.id, tests[0].id);
	return { tests: latestFull ? [latestFull, ...tests.slice(1)] : tests };
};
