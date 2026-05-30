<script lang="ts">
	import { ChevronLeft, Info, Share2, Calendar } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import VerdictRing from '$lib/components/VerdictRing.svelte';
	import MarkerRow from '$lib/components/MarkerRow.svelte';
	import Button from '$lib/components/Button.svelte';
	import { panelScore, countByStatus, overallHeadline } from '$lib/ui/status';
	import { formatDate, formatTime } from '$lib/utils/format';

	let { data } = $props();

	const score = $derived(panelScore(data.results));
	const counts = $derived(countByStatus(data.results));
	const total = $derived(data.results.length);

	function back() {
		if (history.length > 1) history.back();
		else location.assign('/dashboard');
	}

	async function share() {
		const text = `My UroScan panel — ${data.test.result_summary}.`;
		if (navigator.share) {
			try {
				await navigator.share({ title: 'UroScan reading', text });
				return;
			} catch {
				/* user dismissed */
			}
		}
		toast.success('Share link copied — your clinician can open the full panel.');
	}
</script>

<svelte:head><title>Reading · UroScan</title></svelte:head>

<header class="flex items-center gap-2 px-4 pb-3.5 pt-2">
	<button
		type="button"
		onclick={back}
		aria-label="Back"
		class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white"
	>
		<ChevronLeft size={20} class="text-slate-600" />
	</button>
	<div class="flex-1">
		<div class="text-[17px] font-bold text-slate-900">Morning sample</div>
		<div class="mono text-xs text-slate-400">
			{formatDate(data.test.created_at)} · {formatTime(data.test.created_at)} · UroScan AI
		</div>
	</div>
</header>

<div class="px-5">
	<section class="rounded-[20px] border border-slate-200 bg-white p-[22px] shadow-md">
		<VerdictRing
			pct={score}
			label={overallHeadline(data.test.status)}
			status={data.test.status}
			sub={counts.normal === total ? `All ${total} markers in range.` : `${counts.normal} of ${total} markers in range.`}
		/>
	</section>

	{#if data.test.ai_insights}
		<p class="mt-4 px-1 text-[14px] leading-relaxed text-slate-600">{data.test.ai_insights}</p>
	{/if}

	<div class="mx-1 mb-3 mt-6 text-[17px] font-bold tracking-[-0.01em] text-slate-900">
		{total} markers
	</div>
	<section class="rounded-[16px] border border-slate-200 bg-white px-4 py-1 shadow-xs">
		{#each data.results as r, i (r.id)}
			<div style="animation: rise 0.4s var(--ease-out) {i * 0.04}s both;">
				<MarkerRow {r} last={i === data.results.length - 1} />
			</div>
		{/each}
	</section>

	<div class="mt-4 flex items-start gap-2.5 rounded-[12px] p-3.5" style="background: var(--bg-app);">
		<Info size={17} class="mt-px shrink-0 text-slate-400" />
		<span class="text-xs leading-relaxed text-slate-500">
			UroScan flags and informs — it does not diagnose. Share flagged results with your clinician.
		</span>
	</div>

	<div class="mt-4 flex gap-2.5">
		<Button full variant="secondary" icon={Share2} onclick={share}>Share</Button>
		<Button full icon={Calendar} onclick={() => toast.success('Saved to your timeline.')}>
			Add to timeline
		</Button>
	</div>
</div>
