import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';
import { getRecentTests } from '$lib/data/tests';
import { getMockTests } from '$lib/mock/data';

export const load: PageServerLoad = async ({ locals }) => {
	const tests = locals.user ? await getRecentTests(locals.supabase, locals.user.id, 1) : [];
	const roboflowConfigured = Boolean(env.ROBOFLOW_API_KEY);

	// Pre-bake a demo result so the scan page has something to show when Roboflow isn't wired up.
	const demoScan = roboflowConfigured
		? null
		: (() => {
				const mock = getMockTests()[1]; // borderline result is more illustrative than all-normal
				return {
					test: { ...mock, id: 'scan-live' },
					results: mock.results ?? []
				};
			})();

	return { latestId: tests[0]?.id ?? null, roboflowConfigured, demoScan };
};
