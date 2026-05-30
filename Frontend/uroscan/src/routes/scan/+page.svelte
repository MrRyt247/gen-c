<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { X } from '@lucide/svelte';

	let { data } = $props();

	// 0 align · 1 reading · 2 analyzing
	let phase = $state(0);
	let lit = $state(0);

	const pads = [
		'#e9d24a', '#7cae5d', '#3f7bb6', '#caa15a', '#b85c8a',
		'#8a9a3c', '#d98c5f', '#6fae9c', '#c2607a', '#9a7bc0'
	];

	const heading = $derived(phase === 0 ? 'Align the strip' : phase === 1 ? 'Reading…' : 'Analyzing');

	function finish() {
		goto(data.latestId ? `/results/${data.latestId}` : '/dashboard', { replaceState: true });
	}
	function cancel() {
		goto('/dashboard', { replaceState: true });
	}

	onMount(() => {
		const timers = [
			setTimeout(() => (phase = 1), 900),
			setTimeout(() => (phase = 2), 2600),
			setTimeout(finish, 3900)
		];
		let iv: ReturnType<typeof setInterval>;
		const litStart = setTimeout(() => {
			iv = setInterval(() => (lit = Math.min(lit + 1, pads.length)), 150);
		}, 900);
		return () => {
			timers.forEach(clearTimeout);
			clearTimeout(litStart);
			clearInterval(iv);
		};
	});
</script>

<svelte:head><title>Scan · UroScan</title></svelte:head>

<div class="animate-fade absolute inset-0 z-50 flex flex-col" style="background: var(--color-slate-900);">
	<!-- top bar -->
	<div class="flex items-center justify-between px-5 pt-14">
		<button
			type="button"
			onclick={cancel}
			aria-label="Cancel scan"
			class="flex h-10 w-10 items-center justify-center rounded-full border-none"
			style="background: rgb(255 255 255 / 0.14);"
		>
			<X size={20} color="#fff" />
		</button>
		<span class="text-sm font-semibold" style="color: rgb(255 255 255 / 0.85);">{heading}</span>
		<div class="w-10"></div>
	</div>

	<!-- scan stage -->
	<div class="flex flex-1 flex-col items-center justify-center">
		<div
			class="relative flex h-[300px] w-[230px] items-center justify-center overflow-hidden rounded-[24px]"
			style="background: #0a1422;"
		>
			<!-- strip -->
			<div class="flex h-[230px] w-[54px] flex-col gap-1 rounded-[9px] bg-white p-[7px]">
				{#each pads as p, i (i)}
					<div
						class="flex-1 rounded-[3px]"
						style="background: {p};
							opacity: {phase === 0 ? 0.55 : i < lit ? 1 : 0.55};
							box-shadow: {phase === 1 && i < lit ? '0 0 12px 1px var(--color-teal-400)' : 'none'};
							transition: all 0.3s ease;"
					></div>
				{/each}
			</div>

			<!-- beam -->
			{#if phase === 1}
				<div
					class="absolute inset-x-0 h-[3px]"
					style="background: var(--color-teal-400); box-shadow: 0 0 16px 3px var(--color-teal-400); animation: scanbeam 1.7s linear;"
				></div>
			{/if}

			<!-- framing corners -->
			{#each [['top-3.5 left-3.5', '6px 0 0 0', 'border-r-0 border-b-0'], ['top-3.5 right-3.5', '0 6px 0 0', 'border-l-0 border-b-0'], ['bottom-3.5 left-3.5', '0 0 0 6px', 'border-r-0 border-t-0'], ['bottom-3.5 right-3.5', '0 0 6px 0', 'border-l-0 border-t-0']] as [pos, radius, sides] (pos)}
				<div
					class="absolute h-[26px] w-[26px] border-[3px] {pos} {sides}"
					style="border-color: var(--color-teal-400); border-radius: {radius};"
				></div>
			{/each}
		</div>

		{#if phase === 2}
			<div
				class="animate-fade mt-[30px] flex items-center gap-2.5 rounded-full px-4 py-2.5"
				style="background: rgb(45 212 196 / 0.16);"
			>
				<span
					class="h-2 w-2 rounded-full"
					style="background: var(--color-teal-400); animation: pulse 1s infinite;"
				></span>
				<span class="mono text-[13px]" style="color: var(--color-teal-400);">Reading 10 markers…</span>
			</div>
		{:else}
			<p class="mt-[30px] max-w-[240px] text-center text-sm" style="color: rgb(255 255 255 / 0.6);">
				{phase === 0
					? 'Place the dipped strip flat inside the frame.'
					: 'Hold steady — keep the strip in view.'}
			</p>
		{/if}
	</div>
</div>
