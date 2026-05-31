<script lang="ts">
	import type { Status } from '$lib/types';
	import { STATE } from '$lib/ui/status';

	let {
		pct = 83,
		label = 'Looking good',
		sub = '',
		status = 'normal'
	}: { pct?: number; label?: string; sub?: string; status?: Status } = $props();

	const r = 52;
	const circ = 2 * Math.PI * r;
	const s = $derived(STATE[status]);
	const offset = $derived(circ * (1 - pct / 100));
</script>

<div class="flex items-center gap-[18px]">
	<div class="relative h-[124px] w-[124px] shrink-0">
		<svg width="124" height="124" viewBox="0 0 124 124">
			<circle cx="62" cy="62" {r} fill="none" stroke="var(--color-slate-100)" stroke-width="11" />
			<circle
				cx="62"
				cy="62"
				{r}
				fill="none"
				stroke={s.c}
				stroke-width="11"
				stroke-linecap="round"
				stroke-dasharray={circ}
				stroke-dashoffset={offset}
				transform="rotate(-90 62 62)"
				style="transition: stroke-dashoffset 0.6s var(--ease-out);"
			/>
		</svg>
		<div class="absolute inset-0 flex flex-col items-center justify-center">
			<span class="mono text-[30px] font-semibold leading-none text-slate-900">{pct}</span>
			<span class="mt-0.5 text-[11px] text-slate-400">/ 100</span>
		</div>
	</div>
	<div>
		<div class="text-[22px] font-bold tracking-[-0.01em] text-slate-900">{label}</div>
		{#if sub}<div class="mt-1 max-w-[180px] text-sm leading-normal text-slate-500">{sub}</div>{/if}
	</div>
</div>
