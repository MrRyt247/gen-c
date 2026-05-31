<script lang="ts">
	import { Bell } from '@lucide/svelte';

	let {
		eyebrow,
		title,
		showBell = true,
		hasAlerts = true,
		onbell
	}: {
		eyebrow: string;
		title: string;
		showBell?: boolean;
		hasAlerts?: boolean;
		onbell?: () => void;
	} = $props();
</script>

<header class="flex items-center justify-between px-5 pb-3.5 pt-1.5">
	<div class="flex items-center gap-[11px]">
		<img src="/brand/uroscan-mark.svg" width="30" height="30" alt="UroScan" class="lg:hidden" />
		<div>
			<div class="text-[12.5px] font-medium leading-none text-slate-400">{eyebrow}</div>
			<div class="mt-[3px] text-[17px] font-bold tracking-[-0.01em] text-slate-900">{title}</div>
		</div>
	</div>
	{#if showBell}
		<button
			type="button"
			onclick={onbell}
			aria-label="Notifications"
			class="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white"
		>
			<Bell size={19} class="text-slate-600" />
			{#if hasAlerts}
				<span
					class="absolute right-2.5 top-2.5 h-[7px] w-[7px] rounded-full border-[1.5px] border-white"
					style="background: var(--color-alert);"
				></span>
			{/if}
		</button>
	{/if}
</header>
