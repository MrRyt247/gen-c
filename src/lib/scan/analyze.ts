import type { MarkerKey, MarkerResult, Status } from '$lib/types';
import { MARKER_META, MARKER_ORDER } from '$lib/data/markers';
import { CHART, CLASS_TO_MARKER, REFERENCE_RANGE, type ColorRef } from '$lib/scan/chart';
import type { PadDetection } from '$lib/server/roboflow';

export type RGB = [number, number, number];

// ── Colour distance (perceptual, via CIE-Lab) ───────────────────────────────
function srgbToLinear(c: number): number {
	c /= 255;
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function rgbToLab([r, g, b]: RGB): [number, number, number] {
	const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b);
	// linear sRGB → XYZ (D65)
	let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
	let y = R * 0.2126 + G * 0.7152 + B * 0.0722;
	let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
	const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
	x = f(x);
	y = f(y);
	z = f(z);
	return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

/** CIE76 ΔE between two RGB colours. Smaller = closer. */
export function colorDistance(a: RGB, b: RGB): number {
	const la = rgbToLab(a), lb = rgbToLab(b);
	return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
}

export function toHex([r, g, b]: RGB): string {
	return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

/** Nearest reference swatch for a sampled pad colour. */
export function matchSwatch(marker: MarkerKey, rgb: RGB): { ref: ColorRef; distance: number } {
	let best = CHART[marker][0];
	let bestD = Infinity;
	for (const ref of CHART[marker]) {
		const d = colorDistance(rgb, ref.rgb);
		if (d < bestD) {
			bestD = d;
			best = ref;
		}
	}
	return { ref: best, distance: bestD };
}

/** Map ΔE distance + detection confidence into a 0–1 read confidence. */
function readConfidence(detectionConf: number, distance: number): number {
	// ΔE under ~12 is a good match; ~40+ is poor. Blend with the detector's score.
	const colorConf = Math.max(0, Math.min(1, 1 - distance / 45));
	return Math.round(detectionConf * 0.5 + colorConf * 0.5 * 100) / 100;
}

export interface SampledPad {
	marker: MarkerKey;
	rgb: RGB;
	detectionConfidence: number;
}

/**
 * Turn detected + sampled pads into a marker panel by cross-checking each
 * pad's colour against the reference chart. Returns rows in strip order.
 */
export function buildPanel(pads: SampledPad[]): MarkerResult[] {
	// One row per marker — keep the highest-detection-confidence pad if duplicated.
	const byMarker = new Map<MarkerKey, SampledPad>();
	for (const p of pads) {
		const existing = byMarker.get(p.marker);
		if (!existing || p.detectionConfidence > existing.detectionConfidence) {
			byMarker.set(p.marker, p);
		}
	}

	const rows: MarkerResult[] = [];
	for (const marker of MARKER_ORDER) {
		const pad = byMarker.get(marker);
		if (!pad) continue;
		const { ref, distance } = matchSwatch(marker, pad.rgb);
		const range = REFERENCE_RANGE[marker];
		rows.push({
			id: `scan-${marker}`,
			test_id: '',
			marker,
			value: ref.value,
			unit: MARKER_META[marker].unit || null,
			status: ref.status,
			reference_min: range?.[0] ?? null,
			reference_max: range?.[1] ?? null,
			color_detected: toHex(pad.rgb),
			confidence: readConfidence(pad.detectionConfidence, distance)
		});
	}
	return rows;
}

/** Filter raw detections to the marker pads we can map (drops strip/background). */
export function markerDetections(predictions: PadDetection[]): PadDetection[] {
	return predictions.filter((p) => CLASS_TO_MARKER[p.class] != null);
}

// ── Plain-language summary (rule-based; no diagnosis) ────────────────────────
const SUMMARY: Record<Status, string> = {
	normal: 'All markers within normal range',
	borderline: 'A few markers slightly outside range',
	abnormal: 'Several markers need attention'
};

export function summarize(results: MarkerResult[]): { summary: string; insights: string } {
	const worst: Status = results.some((r) => r.status === 'abnormal')
		? 'abnormal'
		: results.some((r) => r.status === 'borderline')
			? 'borderline'
			: 'normal';

	const flagged = results
		.filter((r) => r.status !== 'normal')
		.map((r) => MARKER_META[r.marker].label.toLowerCase());

	let insights: string;
	if (worst === 'normal') {
		insights =
			'Every detected marker fell within its normal reference range. Keep up your hydration and routine testing to hold your baseline.';
	} else {
		const list =
			flagged.length === 1
				? flagged[0]
				: `${flagged.slice(0, -1).join(', ')} and ${flagged.at(-1)}`;
		insights =
			worst === 'borderline'
				? `Most markers look healthy; ${list} sat just outside the ideal range. This is often diet, hydration or sample timing — drink water and re-test in a day or two.`
				: `${list[0].toUpperCase() + list.slice(1)} read outside the typical range. This isn't a diagnosis, but it's worth sharing with a clinician — especially if you also feel unwell.`;
	}

	return { summary: SUMMARY[worst], insights };
}
