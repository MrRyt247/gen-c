<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Status } from '$lib/types';
	import { STATE } from '$lib/ui/status';

	let {
		status = 'normal',
		children
	}: { status?: Status; children?: Snippet } = $props();

	const s = $derived(STATE[status]);
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-semibold"
	style="background:{s.bg}; color:{s.fg};"
>
	<span class="h-[7px] w-[7px] rounded-full" style="background:{s.c};"></span>
	{#if children}{@render children()}{:else}{s.badge}{/if}
</span>
