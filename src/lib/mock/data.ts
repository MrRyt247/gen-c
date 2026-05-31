import type { MarkerKey, MarkerResult, Status, Test } from '$lib/types';
import { MARKER_META, MARKER_ORDER } from '$lib/data/markers';
import { DEMO_USER } from '$lib/server/demo';

/** Tiny deterministic PRNG (mulberry32) so demo data is stable across reloads. */
function rng(seed: number) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const STATUS_COLORS: Record<Status, string[]> = {
	normal: ['#bbf7d0', '#fde68a', '#fef9c3', '#d9f99d'],
	borderline: ['#fcd34d', '#fdba74', '#fef08a'],
	abnormal: ['#fca5a5', '#f87171', '#86efac']
};

/** Build a plausible value + reference window for a marker at a given status. */
function buildMarker(
	testId: string,
	marker: MarkerKey,
	status: Status,
	rand: () => number,
	i: number
): MarkerResult {
	const meta = MARKER_META[marker];
	let value = 'Negative';
	let refMin: number | null = null;
	let refMax: number | null = null;

	switch (marker) {
		case 'pH':
			refMin = 4.5;
			refMax = 8.0;
			value = (status === 'normal' ? 5.5 + rand() * 1.5 : status === 'borderline' ? 8.0 + rand() * 0.3 : 8.8 + rand()).toFixed(1);
			break;
		case 'specific_gravity':
			refMin = 1.005;
			refMax = 1.03;
			value = (status === 'normal' ? 1.01 + rand() * 0.015 : 1.032 + rand() * 0.005).toFixed(3);
			break;
		case 'protein':
			value = status === 'normal' ? 'Negative' : status === 'borderline' ? 'Trace' : '100 mg/dL';
			break;
		case 'glucose':
			value = status === 'normal' ? 'Negative' : status === 'borderline' ? '100 mg/dL' : '500 mg/dL';
			break;
		case 'ketones':
			value = status === 'normal' ? 'Negative' : status === 'borderline' ? 'Trace' : '40 mg/dL';
			break;
		case 'urobilinogen':
			refMin = 0.1;
			refMax = 1.0;
			value = (status === 'normal' ? 0.2 + rand() * 0.6 : 2.0 + rand() * 2).toFixed(1);
			break;
		case 'leukocytes':
			value = status === 'normal' ? 'Negative' : status === 'borderline' ? 'Trace' : 'Moderate';
			break;
		default:
			value = status === 'normal' ? 'Negative' : status === 'borderline' ? 'Trace' : 'Positive';
	}

	const palette = STATUS_COLORS[status];
	return {
		id: `${testId}-${marker}`,
		test_id: testId,
		marker,
		value,
		unit: meta.unit || null,
		status,
		reference_min: refMin,
		reference_max: refMax,
		color_detected: palette[i % palette.length],
		confidence: Math.round((0.82 + rand() * 0.17) * 100) / 100
	};
}

/** Roll up the worst marker status into an overall test status. */
export function overallStatus(results: MarkerResult[]): Status {
	if (results.some((r) => r.status === 'abnormal')) return 'abnormal';
	if (results.some((r) => r.status === 'borderline')) return 'borderline';
	return 'normal';
}

const INSIGHTS: Record<Status, string> = {
	normal:
		"Everything looks great. All ten markers fell within their normal reference ranges, with no signs of infection, dehydration or metabolic stress. Keep up your current hydration habits and routine testing to maintain your baseline.",
	borderline:
		"Most markers are healthy, but a few are sitting just outside the ideal range. This is often explained by mild dehydration, recent diet, or the timing of your sample. It's usually not a cause for concern — drink more water and re-test in a day or two to see if the readings settle.",
	abnormal:
		"One or more markers are notably outside their reference range. Combined readings like this can point to a urinary tract infection or elevated blood sugar. This isn't a diagnosis, but it's worth sharing these results with a healthcare professional, especially if you also feel unwell."
};

const SUMMARIES: Record<Status, string> = {
	normal: 'All markers within normal range',
	borderline: 'A few markers slightly elevated',
	abnormal: 'Several markers need attention'
};

/** Months/days ago expressed as an ISO timestamp, anchored to a fixed clock for stability. */
function isoDaysAgo(days: number, hour: number): string {
	const anchor = new Date('2026-05-29T00:00:00Z').getTime();
	const d = new Date(anchor - days * 86400000);
	d.setUTCHours(hour, (days * 7) % 60, 0, 0);
	return d.toISOString();
}

/** A scripted sequence of statuses across the demo history (newest first). */
const SCRIPT: { days: number; hour: number; status: Status }[] = [
	{ days: 1, hour: 8, status: 'normal' },
	{ days: 4, hour: 21, status: 'borderline' },
	{ days: 9, hour: 7, status: 'normal' },
	{ days: 16, hour: 19, status: 'abnormal' },
	{ days: 23, hour: 8, status: 'borderline' },
	{ days: 31, hour: 7, status: 'normal' },
	{ days: 45, hour: 20, status: 'normal' },
	{ days: 60, hour: 9, status: 'borderline' }
];

function buildTest(index: number, days: number, hour: number, overall: Status): Test {
	const id = `demo-test-${String(index + 1).padStart(2, '0')}`;
	const rand = rng(index * 7919 + 13);

	const results: MarkerResult[] = MARKER_ORDER.map((marker, i) => {
		// Distribute the overall status across markers: most normal, a couple carry the flag.
		let status: Status = 'normal';
		if (overall === 'borderline' && (marker === 'pH' || marker === 'protein')) status = 'borderline';
		if (overall === 'abnormal') {
			if (marker === 'leukocytes' || marker === 'nitrites' || marker === 'blood') status = 'abnormal';
			else if (marker === 'protein') status = 'borderline';
		}
		return buildMarker(id, marker, status, rand, i);
	});

	return {
		id,
		user_id: DEMO_USER.id,
		created_at: isoDaysAgo(days, hour),
		status: overall,
		result_summary: SUMMARIES[overall],
		ai_insights: INSIGHTS[overall],
		thumbnail_url: null,
		image_url: null,
		raw_analysis: { engine: 'uroscan-demo', version: 1 },
		results
	};
}

/** The full demo history, newest first. */
export const MOCK_TESTS: Test[] = SCRIPT.map((s, i) => buildTest(i, s.days, s.hour, s.status));

export function getMockTests(): Test[] {
	return MOCK_TESTS;
}

export function getMockTest(id: string): Test | null {
	return MOCK_TESTS.find((t) => t.id === id) ?? null;
}
