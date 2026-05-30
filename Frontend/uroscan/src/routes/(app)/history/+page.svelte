<script lang="ts">
	import AppHeader from '$lib/components/AppHeader.svelte';
	import ReadingCard from '$lib/components/ReadingCard.svelte';
	import { formatMonthKey } from '$lib/utils/format';
	import type { Test } from '$lib/types';

	let { data } = $props();

	function daysAgo(iso: string): number {
		const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
		return Math.floor((start(new Date()) - start(new Date(iso))) / 86400000);
	}

	function bucketOf(iso: string): string {
		const d = daysAgo(iso);
		if (d <= 0) return 'Today';
		if (d === 1) return 'Yesterday';
		if (d < 7) return 'This week';
		return formatMonthKey(iso);
	}

	// Ordered groups (tests already arrive newest-first).
	const groups = $derived.by(() => {
		const map = new Map<string, Test[]>();
		for (const t of data.tests) {
			const key = bucketOf(t.created_at);
			(map.get(key) ?? map.set(key, []).get(key)!).push(t);
		}
		return [...map.entries()];
	});
</script>

<svelte:head><title>History · UroScan</title></svelte:head>

<AppHeader eyebrow={data.user?.name ?? ''} title="History" />

<div class="px-5">
	{#if data.tests.length}
		{#each groups as [label, items] (label)}
			<div class="mx-1 mb-3 mt-6 text-[17px] font-bold tracking-[-0.01em] text-slate-900">
				{label}
			</div>
			<div class="flex flex-col gap-2.5">
				{#each items as test (test.id)}
					<ReadingCard {test} />
				{/each}
			</div>
		{/each}
	{:else}
		<p class="mt-10 text-center text-[15px] text-slate-500">
			No readings yet — scan your first strip to start your timeline.
		</p>
	{/if}
</div>
