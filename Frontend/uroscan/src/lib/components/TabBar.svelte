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
	const left = tabs.slice(0, 2);
	const right = tabs.slice(2);

	function active(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<nav
	class="scrim fixed inset-x-0 bottom-0 z-40 mx-auto flex items-center justify-around border-t pb-[26px] pt-2"
	style="max-width: var(--shell-max); border-color: var(--color-slate-100);"
>
	{#each left as t (t.href)}
		{@render tab(t)}
	{/each}

	<a
		href="/scan"
		aria-label="Scan a strip"
		class="-mt-7 flex h-[58px] w-[58px] items-center justify-center rounded-full border-4 border-white bg-blue-500"
		style="box-shadow: 0 8px 18px rgb(46 99 240 / 0.4);"
	>
		<ScanLine size={26} strokeWidth={2.2} color="#fff" />
	</a>

	{#each right as t (t.href)}
		{@render tab(t)}
	{/each}
</nav>

{#snippet tab(t: Tab)}
	{@const on = active(t.href)}
	{@const Icon = t.icon}
	<a
		href={t.href}
		class="flex w-16 flex-col items-center gap-[3px] px-3 py-1"
		aria-current={on ? 'page' : undefined}
	>
		<Icon
			size={23}
			strokeWidth={on ? 2.4 : 2}
			color={on ? 'var(--color-blue-500)' : 'var(--color-slate-400)'}
		/>
		<span
			class="text-[10.5px]"
			style="font-weight: {on ? 700 : 500}; color: {on
				? 'var(--color-blue-600)'
				: 'var(--color-slate-400)'};"
		>
			{t.label}
		</span>
	</a>
{/snippet}
