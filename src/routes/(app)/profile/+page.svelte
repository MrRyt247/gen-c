<script lang="ts">
	import type { Component } from 'svelte';
	import { enhance } from '$app/forms';
	import type { IconProps } from '@lucide/svelte';
	import { HeartPulse, Share2, Bell, FlaskConical, Info, ChevronRight, LogOut } from '@lucide/svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import { initials } from '$lib/utils/format';

	let { data } = $props();

	const name = $derived(data.user?.name ?? 'UroScan user');
	const email = $derived(data.user?.email ?? '');
</script>

{#snippet row(icon: Component<IconProps>, title: string, detail: string, color: string, bg: string, last = false)}
	{@const Icon = icon}
	<div class="flex items-center gap-3.5 py-3.5" class:border-b={!last} style="border-color: var(--color-slate-100);">
		<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" style="background: {bg};">
			<Icon size={19} {color} />
		</div>
		<span class="flex-1 text-[15px] font-medium text-slate-900">{title}</span>
		{#if detail}<span class="mono text-[13px] text-slate-400">{detail}</span>{/if}
		<ChevronRight size={17} class="text-slate-300" />
	</div>
{/snippet}

<svelte:head><title>Account · UroScan</title></svelte:head>

<AppHeader eyebrow={name} title="Account" showBell={false} />

<div class="px-5 lg:mx-auto lg:max-w-lg lg:px-0">
	<div class="flex items-center gap-4 rounded-[20px] border border-slate-200 bg-white p-5 shadow-xs">
		<div
			class="flex h-[58px] w-[58px] items-center justify-center rounded-full text-[22px] font-bold"
			style="background: var(--color-blue-100); color: var(--color-blue-600);"
		>
			{initials(name)}
		</div>
		<div class="min-w-0">
			<div class="text-[19px] font-bold text-slate-900">{name}</div>
			<div class="mono truncate text-[13px] text-slate-500">{email}</div>
		</div>
	</div>

	<div class="mx-1 mb-3 mt-6 text-[17px] font-bold tracking-[-0.01em] text-slate-900">Care</div>
	<div class="rounded-[16px] border border-slate-200 bg-white px-4 py-1 shadow-xs">
		{@render row(HeartPulse, 'Connected clinician', 'Dr. Okafor', 'var(--color-teal-500)', 'var(--color-teal-100)')}
		{@render row(Share2, 'Sharing & reports', '', 'var(--color-blue-500)', 'var(--color-blue-50)')}
		{@render row(Bell, 'Alerts', 'On', 'var(--color-blue-500)', 'var(--color-blue-50)', true)}
	</div>

	<div class="mx-1 mb-3 mt-6 text-[17px] font-bold tracking-[-0.01em] text-slate-900">App</div>
	<div class="rounded-[16px] border border-slate-200 bg-white px-4 py-1 shadow-xs">
		{@render row(FlaskConical, 'Strip type', '10-panel', 'var(--color-amber-600)', 'var(--color-amber-100)')}
		{@render row(Info, 'About UroScan', '', 'var(--color-slate-500)', 'var(--color-slate-100)', true)}
	</div>

	<form method="POST" action="?/signout" use:enhance class="mt-6">
		<button
			type="submit"
			class="flex w-full items-center justify-center gap-2 rounded-[12px] border border-slate-200 bg-white px-5 py-[13px] text-base font-semibold text-slate-600 transition-colors hover:border-slate-300 active:scale-[0.97]"
		>
			<LogOut size={18} strokeWidth={2.2} />
			Sign out
		</button>
	</form>

	<p class="mt-5 px-2 text-center text-[12px] leading-relaxed text-slate-400">
		UroScan flags and informs — it does not diagnose. Always confirm with your clinician.
	</p>
</div>
