import type { Status } from '$lib/types';

/** "Mon, 12 May 2026" */
export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}

/** "3:42 PM" */
export function formatTime(iso: string): string {
	return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** "May 2026" — used for grouping history entries. */
export function formatMonthKey(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/** Relative-ish phrasing: "Today", "Yesterday", "3 days ago", else a date. */
export function relativeDay(iso: string, now = new Date()): string {
	const then = new Date(iso);
	const days = Math.floor((startOfDay(now) - startOfDay(then)) / 86400000);
	if (days <= 0) return 'Today';
	if (days === 1) return 'Yesterday';
	if (days < 7) return `${days} days ago`;
	return formatDate(iso);
}

function startOfDay(d: Date): number {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Time-of-day greeting. */
export function greeting(now = new Date()): string {
	const h = now.getHours();
	if (h < 12) return 'Good morning';
	if (h < 18) return 'Good afternoon';
	return 'Good evening';
}

export const STATUS_LABEL: Record<Status, string> = {
	normal: 'Normal',
	borderline: 'Borderline',
	abnormal: 'Abnormal'
};

/** Initials for an avatar fallback, e.g. "Ama Mensah" → "AM". */
export function initials(name: string): string {
	return name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((p) => p[0]?.toUpperCase() ?? '')
		.join('');
}
