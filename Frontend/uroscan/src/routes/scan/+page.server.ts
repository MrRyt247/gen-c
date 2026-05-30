import type { PageServerLoad } from './$types';
import { getRecentTests } from '$lib/data/tests';

export const load: PageServerLoad = async ({ locals }) => {
	// The demo can't persist a new scan, so the flow resolves to the latest reading.
	const tests = locals.user ? await getRecentTests(locals.supabase, locals.user.id, 1) : [];
	return { latestId: tests[0]?.id ?? null };
};
