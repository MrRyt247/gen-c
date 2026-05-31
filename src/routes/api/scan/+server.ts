import { error, json } from '@sveltejs/kit';
import { detectPads } from '$lib/server/roboflow';
import type { RequestHandler } from './$types';

/** POST { image: <base64 data URL or raw base64> } → Roboflow pad detections. */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Sign in to scan.');

	let image: unknown;
	try {
		({ image } = await request.json());
	} catch {
		error(400, 'Expected a JSON body.');
	}
	if (typeof image !== 'string' || image.length < 100) {
		error(400, 'Missing image data.');
	}

	try {
		const result = await detectPads(image);
		return json(result);
	} catch (e) {
		console.error('[uroscan] roboflow inference failed:', e);
		error(502, e instanceof Error ? e.message : 'Inference failed.');
	}
};
