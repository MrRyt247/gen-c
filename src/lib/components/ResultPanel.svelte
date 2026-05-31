<script lang="ts">
	import { Info } from '@lucide/svelte';
	import type { MarkerResult, Status } from '$lib/types';
	import VerdictRing from '$lib/components/VerdictRing.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import MarkerRow from '$lib/components/MarkerRow.svelte';
	import { panelScore, countByStatus, overallHeadline, STATE } from '$lib/ui/status';
	import { MARKER_META } from '$lib/data/markers';

	let {
		status,
		results,
		insights = null,
		animate = false
	}: {
		status: Status;
		results: MarkerResult[];
		insights?: string | null;
		animate?: boolean;
	} = $props();

	const score = $derived(panelScore(results));
	const counts = $derived(countByStatus(results));
	const total = $derived(results.length);
	const sub = $derived(
		total === 0
			? 'No markers detected.'
			: counts.normal === total
				? `All ${total} markers in range.`
				: `${counts.normal} of ${total} markers in range.`
	);

	const hasDetectedColors = $derived(results.some((r) => r.color_detected));

	const STRIP_LABEL: Record<string, string> = {
		pH: 'pH',
		specific_gravity: 'SG',
		protein: 'Prot',
		glucose: 'Glu',
		ketones: 'Ket',
		bilirubin: 'Bil',
		urobilinogen: 'UBG',
		blood: 'Bld',
		leukocytes: 'LEU',
		nitrites: 'NIT'
	};
</script>

<section class="rounded-[20px] border border-slate-200 bg-white p-[22px] shadow-md">
	<VerdictRing pct={score} label={overallHeadline(status)} {status} {sub} />

	<!-- Status summary badges -->
	<div class="mt-4 flex flex-wrap gap-2">
		{#if counts.normal}<Badge status="normal">{counts.normal} in range</Badge>{/if}
		{#if counts.borderline}<Badge status="borderline">{counts.borderline} borderline</Badge>{/if}
		{#if counts.abnormal}<Badge status="abnormal">{counts.abnormal} flagged</Badge>{/if}
	</div>

	<!-- Detected strip colour preview — mirrors the physical strip left-to-right -->
	{#if hasDetectedColors}
		<div class="mt-5">
			<div class="eyebrow mb-2 text-slate-400">Detected strip</div>
			<div class="flex gap-[3px]">
				{#each results as r (r.id)}
					{@const s = STATE[r.status]}
					<div
						class="flex flex-1 flex-col items-center gap-[3px]"
						title="{MARKER_META[r.marker].label}: {r.value}"
					>
						<div
							class="w-full rounded-[4px]"
							style="height: 28px;
								   background: {r.color_detected ?? 'var(--color-slate-100)'};
								   border: 2px solid {s.c};"
						></div>
						<div class="h-1.5 w-1.5 rounded-full" style="background: {s.c};"></div>
						<span class="text-[8px] leading-none text-slate-400">
							{STRIP_LABEL[r.marker] ?? r.marker.slice(0, 3).toUpperCase()}
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</section>

{#if insights}
	<p class="mt-4 px-1 text-[14px] leading-relaxed text-slate-600">{insights}</p>
{/if}

<div class="mx-1 mb-3 mt-6 text-[17px] font-bold tracking-[-0.01em] text-slate-900">
	{total}
	{total === 1 ? 'marker' : 'markers'}
</div>

<section class="rounded-[16px] border border-slate-200 bg-white px-4 py-1 shadow-xs">
	{#each results as r, i (r.id)}
		<div style={animate ? `animation: rise 0.4s var(--ease-out) ${i * 0.04}s both;` : ''}>
			<MarkerRow {r} last={i === results.length - 1} />
		</div>
	{/each}
</section>

<div
	class="mt-4 flex items-start gap-2.5 rounded-[12px] p-3.5"
	style="background: var(--bg-app);"
>
	<Info size={17} class="mt-px shrink-0 text-slate-400" />
	<span class="text-xs leading-relaxed text-slate-500">
		UroScan flags and informs — it does not diagnose. Share flagged results with your clinician.
	</span>
</div>
