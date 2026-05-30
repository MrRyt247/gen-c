import type { PadDetection } from '$lib/server/roboflow';
import type { RGB } from '$lib/scan/analyze';

/**
 * Browser-only image helpers: draw a chosen/captured photo onto a canvas
 * (downscaled to keep the upload small) and sample reagent-pad colours.
 */

export interface PreparedImage {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	/** base64 JPEG data URL, sent to the inference endpoint. */
	dataUrl: string;
	width: number;
	height: number;
}

/** Load a File into a downscaled canvas. Detections will be in this pixel space. */
export async function prepareImage(file: File, maxDim = 900): Promise<PreparedImage> {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
	const width = Math.round(bitmap.width * scale);
	const height = Math.round(bitmap.height * scale);

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) throw new Error('Canvas not supported.');
	ctx.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();

	return { canvas, ctx, dataUrl: canvas.toDataURL('image/jpeg', 0.8), width, height };
}

/**
 * Average colour of a detection's inner region (central 60%, to dodge the pad's
 * printed border and edge glare). Box coords are centre-based, as Roboflow returns.
 */
export function sampleBox(ctx: CanvasRenderingContext2D, box: PadDetection): RGB {
	const iw = ctx.canvas.width;
	const ih = ctx.canvas.height;
	const left = Math.max(0, Math.round(box.x - box.width * 0.3));
	const top = Math.max(0, Math.round(box.y - box.height * 0.3));
	const w = Math.max(1, Math.min(iw - left, Math.round(box.width * 0.6)));
	const h = Math.max(1, Math.min(ih - top, Math.round(box.height * 0.6)));

	const { data } = ctx.getImageData(left, top, w, h);
	let r = 0, g = 0, b = 0, n = 0;
	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] < 8) continue; // skip transparent
		r += data[i];
		g += data[i + 1];
		b += data[i + 2];
		n++;
	}
	if (!n) return [0, 0, 0];
	return [r / n, g / n, b / n];
}
