<script lang="ts">
	import AppHeader from '$lib/components/AppHeader.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import TrendChart from '$lib/components/TrendChart.svelte';
	import { MARKER_META } from '$lib/data/markers';
	import type { MarkerKey, MarkerResult, Status, Test } from '$lib/types';
	import { formatDate } from '$lib/utils/format';

	let { data } = $props();

	// Markers worth charting (vary over time and read cleanly as a line).
	const TREND_KEYS: MarkerKey[] = ['specific_gravity', 'pH', 'protein', 'glucose'];
	const REF: Partial<Record<MarkerKey, [number, number]>> = {
		pH: [4.5, 8.0],
		specific_gravity: [1.005, 1.03],
		urobilinogen: [0.1, 1.0]
	};

	let selected = $state<MarkerKey>('specific_gravity');

	/** Categorical dipstick readings → an ordinal level for plotting. */
	function toNumber(value: string): number {
		const n = Number.parseFloat(value);
		if (Number.isFinite(n)) return n;
		const v = value.toLowerCase();
		if (/(negative|neg|none)/.test(v)) return 0;
		if (/trace/.test(v)) return 1;
		if (/(moderate|positive|\+)/.test(v)) return 2;
		if (/large/.test(v)) return 3;
		return 0;
	}

	// Oldest → newest, so the line reads left-to-right through time.
	const chronological = $derived([...data.tests].reverse());

	function resultFor(test: Test, key: MarkerKey): MarkerResult | undefined {
		return test.results?.find((r) => r.marker === key);
	}

	const series = $derived(
		chronological
			.map((t) => resultFor(t, selected))
			.filter((r): r is MarkerResult => r != null)
	);
	const points = $derived(series.map((r) => toNumber(r.value)));
	const latest = $derived(series.at(-1));
	const latestStatus = $derived<Status>(latest?.status ?? 'normal');
	const average = $derived(
		points.length ? (points.reduce((a, b) => a + b, 0) / points.length) : 0
	);
	const meta = $derived(MARKER_META[selected]);
	const color = $derived(
		latestStatus === 'abnormal'
			? 'var(--color-alert)'
			: latestStatus === 'borderline'
				? 'var(--color-watch)'
				: 'var(--color-blue-500)'
	);
	const decimals = $derived(selected === 'specific_gravity' ? 3 : selected === 'pH' ? 1 : 0);
</script>

<svelte:head><title>Trends · UroScan</title></svelte:head>

<AppHeader eyebrow={data.user?.name ?? ''} title="Your trends" />

<div class="px-5">
	<div class="no-scrollbar flex gap-2 overflow-x-auto pb-1">
		{#each TREND_KEYS as key (key)}
			<button
				type="button"
				onclick={() => (selected = key)}
				class="shrink-0 rounded-full border px-[15px] py-2 text-[13.5px] font-semibold transition-colors"
				style={selected === key
					? 'background: var(--color-blue-500); color:#fff; border-color: var(--color-blue-500);'
					: 'background:#fff; color: var(--color-slate-600); border-color: var(--color-slate-200);'}
			>
				{MARKER_META[key].label}
			</button>
		{/each}
	</div>

	{#if points.length}
		<section class="mt-4 rounded-[20px] border border-slate-200 bg-white p-[22px] shadow-md">
			<div class="mb-[18px] flex items-start justify-between">
				<div>
					<div class="text-[13px] font-medium text-slate-500">{meta.label}</div>
					<div class="mono mt-1 text-[28px] font-semibold text-slate-900">{latest?.value}</div>
				</div>
				<Badge status={latestStatus} />
			</div>
			<TrendChart
				data={points}
				{color}
				band={REF[selected]}
			/>
			<div class="mono mt-2.5 flex justify-between text-[10.5px] text-slate-400">
				<span>{formatDate(chronological[0].created_at)}</span>
				<span>{formatDate(chronological.at(-1)!.created_at)}</span>
			</div>
		</section>

		<div class="mt-3.5 grid grid-cols-2 gap-3">
			<div class="rounded-[16px] border border-slate-200 bg-white p-4">
				<div class="text-[12.5px] text-slate-500">Average</div>
				<div class="mono mt-1 text-[22px] font-semibold text-slate-900">
					{average.toFixed(decimals)}
				</div>
			</div>
			<div class="rounded-[16px] border border-slate-200 bg-white p-4">
				<div class="text-[12.5px] text-slate-500">Readings</div>
				<div class="mono mt-1 text-[22px] font-semibold text-slate-900">{points.length}</div>
			</div>
		</div>

		<p class="mt-4 px-1 text-[13px] leading-relaxed text-slate-500">{meta.about}</p>
	{:else}
		<p class="mt-10 text-center text-[15px] text-slate-500">No readings to chart yet.</p>
	{/if}
</div>
