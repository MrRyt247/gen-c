import type { MarkerResult, Status } from '$lib/types';

/**
 * Visual mapping for the three sacred result states. Domain statuses
 * (normal / borderline / abnormal) map onto the design's normal / watch / alert.
 * `c` is the state colour, `bg` its tint, `fg` an accessible text tone for chips.
 */
export interface StateStyle {
	c: string;
	bg: string;
	fg: string;
	badge: string;
}

export const STATE: Record<Status, StateStyle> = {
	normal: { c: 'var(--color-normal)', bg: 'var(--color-normal-bg)', fg: '#15803d', badge: 'In range' },
	borderline: { c: 'var(--color-watch)', bg: 'var(--color-watch-bg)', fg: '#b25e04', badge: 'Borderline' },
	abnormal: { c: 'var(--color-alert)', bg: 'var(--color-alert-bg)', fg: '#dc2626', badge: 'Out of range' }
};

/** Short, calm verdict shown beside a marker value. */
export function verdictFor(r: Pick<MarkerResult, 'status' | 'value'>): string {
	if (/^trace$/i.test(r.value)) return 'Trace';
	if (r.status === 'normal') return 'Normal';
	if (r.status === 'borderline') return 'Borderline';
	return 'Out of range';
}

/**
 * Position (0–100) of the marker's pin along the low · normal · high track.
 * Numeric markers map their reference window to the centre band [15, 80];
 * categorical markers fall back to a status-based slot.
 */
export function markerPosition(r: MarkerResult): number {
	const v = Number.parseFloat(r.value);
	const { reference_min: lo, reference_max: hi } = r;
	if (Number.isFinite(v) && lo != null && hi != null && hi > lo) {
		let pos: number;
		if (v <= lo) pos = 15 - (15 * (lo - v)) / (lo * 0.15 || 1);
		else if (v >= hi) pos = 80 + (16 * (v - hi)) / (hi * 0.15 || 1);
		else pos = 15 + (65 * (v - lo)) / (hi - lo);
		return Math.max(3, Math.min(97, pos));
	}
	return r.status === 'normal' ? 48 : r.status === 'borderline' ? 74 : 91;
}

/** Overall 0–100 panel score: normal full credit, borderline partial, abnormal little. */
export function panelScore(results: MarkerResult[]): number {
	if (!results.length) return 0;
	const weight: Record<Status, number> = { normal: 1, borderline: 0.62, abnormal: 0.15 };
	const sum = results.reduce((acc, r) => acc + weight[r.status], 0);
	return Math.round((sum / results.length) * 100);
}

export interface StatusCounts {
	normal: number;
	borderline: number;
	abnormal: number;
}

export function countByStatus(results: MarkerResult[]): StatusCounts {
	return results.reduce(
		(acc, r) => ((acc[r.status] += 1), acc),
		{ normal: 0, borderline: 0, abnormal: 0 } as StatusCounts
	);
}

/** Headline for an overall verdict ring, by worst-marker status. */
export function overallHeadline(status: Status): string {
	if (status === 'normal') return 'Looking good';
	if (status === 'borderline') return 'Worth a look';
	return 'Needs attention';
}
