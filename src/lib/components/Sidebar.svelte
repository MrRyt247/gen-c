<script lang="ts">
	import type { Component } from 'svelte';
	import type { IconProps } from '@lucide/svelte';
	import { page } from '$app/state';
	import { House, TrendingUp, ScanLine, Calendar, User } from '@lucide/svelte';

	interface Tab {
		href: string;
		icon: Component<IconProps>;
		label: string;
	}

	const tabs: Tab[] = [
		{ href: '/dashboard', icon: House, label: 'Home' },
		{ href: '/trends', icon: TrendingUp, label: 'Trends' },
		{ href: '/history', icon: Calendar, label: 'History' },
		{ href: '/profile', icon: User, label: 'You' }
	];

	function active(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<aside
	class="hidden lg:flex fixed inset-y-0 left-0 z-30 w-[240px] flex-col border-r border-slate-200 bg-white"
>
	<div class="flex items-center gap-3 border-b border-slate-100 px-5 py-6">
		<img src="/brand/uroscan-mark.svg" width="32" height="32" alt="" />
		<span class="text-[17px] font-bold tracking-[-0.01em] text-slate-900">UroScan</span>
	</div>

	<nav class="flex-1 space-y-0.5 px-3 py-4">
		{#each tabs as t (t.href)}
			{@const on = active(t.href)}
			{@const Icon = t.icon}
			<a
				href={t.href}
				aria-current={on ? 'page' : undefined}
				class="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[14.5px] font-medium transition-colors hover:bg-slate-50"
				style={on
					? 'background: var(--color-blue-50); color: var(--color-blue-600);'
					: 'color: var(--color-slate-600);'}
			>
				<Icon
					size={19}
					strokeWidth={on ? 2.4 : 2}
					color={on ? 'var(--color-blue-500)' : 'var(--color-slate-400)'}
				/>
				{t.label}
			</a>
		{/each}
	</nav>

	<div class="px-4 pb-6">
		<a
			href="/scan"
			class="flex w-full items-center justify-center gap-2 rounded-[12px] bg-blue-500 px-4 py-3 text-[14.5px] font-semibold text-white transition-colors hover:bg-blue-600 active:bg-blue-700"
			style="box-shadow: 0 4px 12px rgb(46 99 240 / 0.28);"
		>
			<ScanLine size={18} strokeWidth={2.2} />
			Scan a strip
		</a>
	</div>
</aside>
