<script lang="ts">
	import { ChevronLeft, Share2, Calendar } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import ResultPanel from '$lib/components/ResultPanel.svelte';
	import Button from '$lib/components/Button.svelte';
	import { formatDate, formatTime } from '$lib/utils/format';

	let { data } = $props();

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
	<ResultPanel
		status={data.test.status}
		results={data.results}
		insights={data.test.ai_insights}
		animate
	/>

	<div class="mt-4 flex gap-2.5">
		<Button full variant="secondary" icon={Share2} onclick={share}>Share</Button>
		<Button full icon={Calendar} onclick={() => toast.success('Saved to your timeline.')}>
			Add to timeline
		</Button>
	</div>
</div>
