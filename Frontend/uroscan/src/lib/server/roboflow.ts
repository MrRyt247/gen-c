import { env } from '$env/dynamic/private';

/** One reagent-pad detection from the Roboflow model. */
export interface PadDetection {
	x: number;
	y: number;
	width: number;
	height: number;
	confidence: number;
	class: string;
	class_id: number;
	detection_id: string;
}

export interface RoboflowResult {
	inference_id?: string;
	time?: number;
	image: { width: number; height: number };
	predictions: PadDetection[];
}

const MODEL = env.ROBOFLOW_MODEL || 'urine-test-strips-main/24';

/**
 * Run the hosted urine-strip detection model on a base64-encoded image.
 * Returns pad bounding boxes + marker labels. The API key stays server-side.
 */
export async function detectPads(base64Image: string): Promise<RoboflowResult> {
	const key = env.ROBOFLOW_API_KEY;
	if (!key) throw new Error('ROBOFLOW_API_KEY is not configured.');

	// Roboflow's serverless endpoint wants the raw base64 (no data: prefix).
	const body = base64Image.replace(/^data:image\/\w+;base64,/, '');

	const res = await fetch(
		`https://serverless.roboflow.com/${MODEL}?api_key=${encodeURIComponent(key)}`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body
		}
	);

	if (!res.ok) {
		const detail = await res.text().catch(() => '');
		throw new Error(`Roboflow request failed (${res.status}): ${detail.slice(0, 200)}`);
	}

	return (await res.json()) as RoboflowResult;
}
