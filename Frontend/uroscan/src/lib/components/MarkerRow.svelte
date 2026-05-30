<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';
	import type { MarkerResult } from '$lib/types';
	import { MARKER_META } from '$lib/data/markers';
	import { CHART } from '$lib/scan/chart';
	import { STATE, markerPosition, verdictFor } from '$lib/ui/status';

	let { r, last = false }: { r: MarkerResult; last?: boolean } = $props();

	const meta = $derived(MARKER_META[r.marker]);
	const s = $derived(STATE[r.status]);
	const pos = $derived(markerPosition(r));
	const verdict = $derived(verdictFor(r));
	const refs = $derived(CHART[r.marker]);

	let expanded = $state(false);
</script>

<div class="py-[15px]" class:border-b={!last} style="border-color: var(--color-slate-100);">
	<!-- Main row — tappable to expand detail -->
	<button
		type="button"
		class="grid w-full grid-cols-[1fr_auto] items-center gap-3 text-left"
		onclick={() => (expanded = !expanded)}
		aria-expanded={expanded}
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

		<div class="mono min-w-[88px] text-right">
			<div class="text-base font-semibold text-slate-900">
				{r.value}{#if meta.unit}<span class="text-[11px] text-slate-400"> {meta.unit}</span>{/if}
			</div>
			<div class="mt-0.5 flex items-center justify-end gap-1">
				<span class="text-[11px] font-semibold" style="color: {s.c};">{verdict}</span>
				<span
					class="text-slate-400 transition-transform duration-200"
					style="display:inline-block; transform: rotate({expanded ? 180 : 0}deg);"
				>
					<ChevronDown size={12} />
				</span>
			</div>
		</div>
	</button>

	<!-- Expanded detail panel -->
	{#if expanded}
		<div
			class="mt-3 space-y-3.5 rounded-[14px] p-4"
			style="background: var(--bg-app); border: 1px solid var(--color-slate-100);"
		>
			<!-- About -->
			<p class="text-[13px] leading-[1.55] text-slate-600">{meta.about}</p>

			<!-- Normal range -->
			<div
				class="flex items-center justify-between border-t pt-3"
				style="border-color: var(--color-slate-100);"
			>
				<span class="text-[12px] text-slate-400">Normal range</span>
				<span class="mono text-[12px] font-semibold text-slate-700">{meta.referenceLabel}</span>
			</div>

			<!-- Standard colour chart -->
			<div>
				<div class="eyebrow mb-2.5 text-slate-400">Standard colour chart</div>
				<div class="flex flex-wrap items-end gap-2">
					{#each refs as ref, i (i)}
						{@const refS = STATE[ref.status]}
						{@const isMatch = r.value === ref.value}
						<div class="flex flex-col items-center gap-1">
							<div
								class="h-7 w-7 rounded-[6px]"
								style="background: rgb({ref.rgb[0]} {ref.rgb[1]} {ref.rgb[2]});
									   border: 2.5px solid {isMatch ? refS.c : 'transparent'};
									   box-shadow: {isMatch ? `0 0 0 1.5px ${refS.c}` : 'none'};"
								title="{ref.value} — {ref.status}"
							></div>
							<span
								class="max-w-[38px] truncate text-center text-[9px] leading-tight"
								style="color: {isMatch ? refS.c : 'var(--color-slate-400)'}; font-weight: {isMatch ? 600 : 400};"
								>{ref.value}</span
							>
						</div>
					{/each}

					{#if r.color_detected}
						<div
							class="ml-1.5 flex flex-col items-center gap-1 border-l pl-2.5"
							style="border-color: var(--color-slate-200);"
						>
							<div
								class="h-7 w-7 rounded-[6px]"
								style="background: {r.color_detected}; border: 2.5px solid {s.c};"
								title="Your detected colour: {r.color_detected}"
							></div>
							<span class="text-[9px] font-semibold leading-tight" style="color: {s.c};"
								>Yours</span
							>
						</div>
					{/if}
				</div>
			</div>

			<!-- Read confidence -->
			{#if r.confidence != null}
				<div
					class="flex items-center justify-between border-t pt-3"
					style="border-color: var(--color-slate-100);"
				>
					<span class="text-[12px] text-slate-400">Read confidence</span>
					<span
						class="mono rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
						style="background: {r.confidence >= 0.8
							? 'var(--color-normal-bg)'
							: r.confidence >= 0.6
								? 'var(--color-watch-bg)'
								: 'var(--color-alert-bg)'};
							   color: {r.confidence >= 0.8 ? '#15803d' : r.confidence >= 0.6 ? '#b25e04' : '#dc2626'};"
					>
						{Math.round(r.confidence * 100)}%
					</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
