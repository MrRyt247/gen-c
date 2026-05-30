<script lang="ts">
	import { ArrowRight, Droplets } from '@lucide/svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import VerdictRing from '$lib/components/VerdictRing.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Button from '$lib/components/Button.svelte';
	import ReadingCard from '$lib/components/ReadingCard.svelte';
	import { panelScore, countByStatus, overallHeadline } from '$lib/ui/status';
	import { greeting } from '$lib/utils/format';
	import { MARKER_META } from '$lib/data/markers';

	let { data } = $props();

	const firstName = $derived((data.user?.name ?? 'there').split(' ')[0]);
	const latest = $derived(data.tests[0]);
	const results = $derived(latest?.results ?? []);
	const counts = $derived(countByStatus(results));
	const total = $derived(results.length);
	const score = $derived(panelScore(results));

	const sub = $derived(
		total === 0
			? 'No readings yet.'
			: counts.normal === total
				? `All ${total} markers in range.`
				: `${counts.normal} of ${total} markers in range.`
	);

	// Hydration nudge when the latest sample's concentration is drifting up.
	const sg = $derived(results.find((r) => r.marker === 'specific_gravity'));
	const showNudge = $derived(sg != null && sg.status !== 'normal');
</script>

<svelte:head><title>UroScan</title></svelte:head>

<AppHeader eyebrow="{greeting()}," title={firstName} />

<div class="px-5">
	{#if latest}
		<!-- Latest reading hero -->
		<section
			class="animate-rise rounded-[20px] border border-slate-200 bg-white p-[22px] shadow-md"
		>
			<div class="mb-4 flex items-center justify-between">
				<span class="eyebrow text-blue-600">Latest reading</span>
				<span class="mono text-[11.5px] text-slate-400">{latest.result_summary}</span>
			</div>
			<VerdictRing pct={score} label={overallHeadline(latest.status)} status={latest.status} {sub} />
			<div class="mt-[18px] flex flex-wrap gap-2">
				{#if counts.normal}<Badge status="normal">{counts.normal} in range</Badge>{/if}
				{#if counts.borderline}<Badge status="borderline">{counts.borderline} borderline</Badge>{/if}
				{#if counts.abnormal}<Badge status="abnormal">{counts.abnormal} flagged</Badge>{/if}
			</div>
			<div class="mt-[18px]">
				<Button full icon={ArrowRight} href="/results/{latest.id}">View full panel</Button>
			</div>
		</section>

		{#if showNudge && sg}
			<div
				class="mt-3.5 flex items-center gap-3.5 rounded-[16px] border p-4"
				style="background: var(--color-amber-100); border-color: #f6dca7;"
			>
				<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white">
					<Droplets size={22} color="var(--color-amber-600)" />
				</div>
				<div class="flex-1">
					<div class="text-[14.5px] font-semibold" style="color:#7a4a06;">Drink a glass of water</div>
					<div class="mt-0.5 text-[12.5px]" style="color:#9a6a26;">
						{MARKER_META.specific_gravity.label} is trending up — rehydrate and rescan tomorrow.
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<section class="rounded-[20px] border border-slate-200 bg-white p-8 text-center shadow-sm">
			<p class="text-[15px] text-slate-500">No readings yet — scan your first strip to start your timeline.</p>
			<div class="mt-5"><Button full href="/scan">Scan a strip</Button></div>
		</section>
	{/if}

	{#if data.tests.length}
		<div class="mx-1 mb-3 mt-6 flex items-baseline justify-between">
			<span class="text-[17px] font-bold tracking-[-0.01em] text-slate-900">Recent readings</span>
			<a href="/history" class="text-[13px] font-semibold text-blue-600">See all</a>
		</div>
		<div class="flex flex-col gap-2.5">
			{#each data.tests as test (test.id)}
				<ReadingCard {test} />
			{/each}
		</div>
	{/if}
</div>
