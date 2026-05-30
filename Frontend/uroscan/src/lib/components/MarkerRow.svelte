<script lang="ts">
	import type { MarkerResult } from '$lib/types';
	import { MARKER_META } from '$lib/data/markers';
	import { STATE, markerPosition, verdictFor } from '$lib/ui/status';

	let { r, last = false }: { r: MarkerResult; last?: boolean } = $props();

	const meta = $derived(MARKER_META[r.marker]);
	const s = $derived(STATE[r.status]);
	const pos = $derived(markerPosition(r));
	const verdict = $derived(verdictFor(r));
</script>

<div
	class="grid grid-cols-[1fr_96px] items-center gap-3 py-[15px]"
	class:border-b={!last}
	style="border-color: var(--color-slate-100);"
>
	<div>
		<div class="flex items-center gap-2">
			{#if r.color_detected}
				<span
					class="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-200"
					style="background: {r.color_detected};"
					title="Detected pad colour"
				></span>
			{/if}
			<span class="text-[15.5px] font-semibold text-slate-900">{meta.label}</span>
			<span class="text-xs text-slate-400">{meta.category}</span>
		</div>
		<!-- low · normal · high track -->
		<div
			class="relative mt-[9px] h-[7px] rounded-full"
			style="background: linear-gradient(90deg, var(--color-alert-bg) 0 15%, var(--color-normal-bg) 15% 80%, var(--color-watch-bg) 80% 100%);"
		>
			<div
				class="absolute top-[-3px] h-[13px] w-[13px] -translate-x-1/2 rounded-full border-[2.5px] border-white"
				style="left: {pos}%; background: {s.c}; box-shadow: 0 1px 3px rgb(15 27 45 / 0.18);"
			></div>
		</div>
	</div>
	<div class="mono text-right">
		<div class="text-base font-semibold text-slate-900">
			{r.value}{#if meta.unit}<span class="text-[11px] text-slate-400"> {meta.unit}</span>{/if}
		</div>
		<div class="mt-0.5 text-[11px] font-semibold" style="color: {s.c};">{verdict}</div>
	</div>
</div>
