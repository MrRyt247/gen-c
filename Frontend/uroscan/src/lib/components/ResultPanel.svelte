<script lang="ts">
	import { Info } from '@lucide/svelte';
	import type { MarkerResult, Status } from '$lib/types';
	import VerdictRing from '$lib/components/VerdictRing.svelte';
	import MarkerRow from '$lib/components/MarkerRow.svelte';
	import { panelScore, countByStatus, overallHeadline } from '$lib/ui/status';

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
</script>

<section class="rounded-[20px] border border-slate-200 bg-white p-[22px] shadow-md">
	<VerdictRing pct={score} label={overallHeadline(status)} {status} {sub} />
</section>

{#if insights}
	<p class="mt-4 px-1 text-[14px] leading-relaxed text-slate-600">{insights}</p>
{/if}

<div class="mx-1 mb-3 mt-6 text-[17px] font-bold tracking-[-0.01em] text-slate-900">
	{total} {total === 1 ? 'marker' : 'markers'}
</div>
<section class="rounded-[16px] border border-slate-200 bg-white px-4 py-1 shadow-xs">
	{#each results as r, i (r.id)}
		<div style={animate ? `animation: rise 0.4s var(--ease-out) ${i * 0.04}s both;` : ''}>
			<MarkerRow {r} last={i === results.length - 1} />
		</div>
	{/each}
</section>

<div class="mt-4 flex items-start gap-2.5 rounded-[12px] p-3.5" style="background: var(--bg-app);">
	<Info size={17} class="mt-px shrink-0 text-slate-400" />
	<span class="text-xs leading-relaxed text-slate-500">
		UroScan flags and informs — it does not diagnose. Share flagged results with your clinician.
	</span>
</div>
