<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Check, TriangleAlert, Droplet, ChevronRight, HardDrive } from '@lucide/svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import ReadingCard from '$lib/components/ReadingCard.svelte';
	import { formatMonthKey, formatTime, relativeDay } from '$lib/utils/format';
	import { STATE } from '$lib/ui/status';
	import type { Test, MarkerResult } from '$lib/types';

	let { data } = $props();

	interface LocalEntry {
		test: Test;
		results: MarkerResult[];
		savedAt: string;
	}

	let localEntries = $state<LocalEntry[]>([]);

	onMount(() => {
		try {
			const raw = localStorage.getItem('uroscan-timeline');
			if (raw) localEntries = JSON.parse(raw) as LocalEntry[];
		} catch { /* corrupt storage — ignore */ }
	});

	function viewLocalEntry(entry: LocalEntry) {
		try {
			sessionStorage.setItem('uroscan-live', JSON.stringify({ test: entry.test, results: entry.results }));
		} catch { /* ignore */ }
		goto('/results/scan-live');
	}

	// Merge server tests + local-only entries, sorted newest-first.
	const allEntries = $derived.by(() => {
		const serverDates = new Set(data.tests.map((t: Test) => t.created_at));

		const localOnly = localEntries
			.filter((e) => !serverDates.has(e.test.created_at))
			.map((e) => ({ kind: 'local' as const, entry: e }));

		const serverItems = data.tests.map((t: Test) => ({ kind: 'server' as const, test: t }));

		return [...serverItems, ...localOnly].sort((a, b) => {
			const aDate = a.kind === 'server' ? a.test.created_at : a.entry.test.created_at;
			const bDate = b.kind === 'server' ? b.test.created_at : b.entry.test.created_at;
			return new Date(bDate).getTime() - new Date(aDate).getTime();
		});
	});

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

	const groups = $derived.by(() => {
		const map = new Map<string, typeof allEntries>();
		for (const item of allEntries) {
			const iso = item.kind === 'server' ? item.test.created_at : item.entry.test.created_at;
			const key = bucketOf(iso);
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(item);
		}
		return [...map.entries()];
	});
</script>

<svelte:head><title>History · UroScan</title></svelte:head>

<AppHeader eyebrow={data.user?.name ?? ''} title="History" />

<div class="px-5 lg:px-8">
	{#if allEntries.length}
		{#each groups as [label, items] (label)}
			<div class="mx-1 mb-3 mt-6 text-[17px] font-bold tracking-[-0.01em] text-slate-900">
				{label}
			</div>
			<div class="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
				{#each items as item (item.kind === 'server' ? item.test.id : item.entry.savedAt)}
					{#if item.kind === 'server'}
						<ReadingCard test={item.test} />
					{:else}
						<!-- Local (device-only) entry -->
						{@const t = item.entry.test}
						{@const s = STATE[t.status]}
						{@const hour = new Date(t.created_at).getHours()}
						{@const title = hour < 11 ? 'Morning sample' : hour < 17 ? 'Afternoon sample' : 'Evening sample'}
						{@const StatusIcon = t.status === 'normal' ? Check : t.status === 'abnormal' ? TriangleAlert : Droplet}
						<button
							type="button"
							onclick={() => viewLocalEntry(item.entry)}
							class="flex w-full items-center gap-3.5 rounded-[16px] border border-slate-200 bg-white p-4 text-left shadow-xs transition-shadow hover:shadow-sm"
						>
							<div
								class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
								style="background: {s.bg};"
							>
								<StatusIcon size={22} strokeWidth={2.2} color={s.c} />
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span class="text-[15.5px] font-semibold text-slate-900">{title}</span>
									<span
										class="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
										style="background: var(--color-slate-100); color: var(--color-slate-500);"
									>
										<HardDrive size={9} />
										Device
									</span>
								</div>
								<div class="mono mt-0.5 truncate text-[12.5px] text-slate-500">
									{relativeDay(t.created_at)} · {formatTime(t.created_at)} · {t.result_summary}
								</div>
							</div>
							<ChevronRight size={18} class="text-slate-300" />
						</button>
					{/if}
				{/each}
			</div>
		{/each}
	{:else}
		<p class="mt-10 text-center text-[15px] text-slate-500">
			No readings yet — scan your first strip to start your timeline.
		</p>
	{/if}
</div>
