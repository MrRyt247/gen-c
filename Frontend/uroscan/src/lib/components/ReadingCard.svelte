<script lang="ts">
	import { Check, TriangleAlert, Droplet, ChevronRight } from '@lucide/svelte';
	import type { Test } from '$lib/types';
	import { STATE } from '$lib/ui/status';
	import { relativeDay, formatTime } from '$lib/utils/format';

	let { test }: { test: Test } = $props();

	const s = $derived(STATE[test.status]);
	const hour = $derived(new Date(test.created_at).getHours());
	const title = $derived(
		hour < 11 ? 'Morning sample' : hour < 17 ? 'Afternoon sample' : 'Evening sample'
	);
	const when = $derived(`${relativeDay(test.created_at)} · ${formatTime(test.created_at)}`);
	const StatusIcon = $derived(
		test.status === 'normal' ? Check : test.status === 'abnormal' ? TriangleAlert : Droplet
	);
</script>

<a
	href="/results/{test.id}"
	class="flex w-full items-center gap-3.5 rounded-[16px] border border-slate-200 bg-white p-4 text-left shadow-xs transition-shadow hover:shadow-sm"
>
	<div
		class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
		style="background: {s.bg};"
	>
		<StatusIcon size={22} strokeWidth={2.2} color={s.c} />
	</div>
	<div class="min-w-0 flex-1">
		<div class="text-[15.5px] font-semibold text-slate-900">{title}</div>
		<div class="mono mt-0.5 truncate text-[12.5px] text-slate-500">
			{when} · {test.result_summary}
		</div>
	</div>
	<ChevronRight size={18} class="text-slate-300" />
</a>
