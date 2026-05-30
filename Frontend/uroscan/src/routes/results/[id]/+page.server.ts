import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getTestById } from '$lib/data/tests';
import { MARKER_ORDER } from '$lib/data/markers';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) error(401, 'Sign in to view results.');

	const test = await getTestById(locals.supabase, locals.user.id, params.id);
	if (!test) error(404, 'Reading not found.');

	// Present markers in physical strip order.
	const results = [...(test.results ?? [])].sort(
		(a, b) => MARKER_ORDER.indexOf(a.marker) - MARKER_ORDER.indexOf(b.marker)
	);
	return { test, results };
};
