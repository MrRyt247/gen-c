import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getTestById } from '$lib/data/tests';
import { MARKER_ORDER } from '$lib/data/markers';
import type { Test } from '$lib/types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) error(401, 'Sign in to view results.');

	// scan-live results live in the browser's sessionStorage — no DB lookup needed.
	if (params.id === 'scan-live') {
		return { test: null as unknown as Test, results: [], scanLive: true };
	}

	const test = await getTestById(locals.supabase, locals.user.id, params.id);
	if (!test) error(404, 'Reading not found.');

	const results = [...(test.results ?? [])].sort(
		(a, b) => MARKER_ORDER.indexOf(a.marker) - MARKER_ORDER.indexOf(b.marker)
	);
	return { test, results, scanLive: false };
};
