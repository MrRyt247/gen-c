<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import type { IconProps } from '@lucide/svelte';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'teal';

	let {
		variant = 'primary',
		icon,
		full = false,
		type = 'button',
		href,
		onclick,
		children,
		class: klass = ''
	}: {
		variant?: Variant;
		icon?: Component<IconProps>;
		full?: boolean;
		type?: 'button' | 'submit';
		href?: string;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
		class?: string;
	} = $props();

	const variants: Record<Variant, string> = {
		primary:
			'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 hover:shadow-md border border-transparent',
		secondary:
			'bg-white text-blue-600 border border-slate-200 hover:border-blue-300 hover:shadow-sm',
		ghost: 'bg-transparent text-blue-600 hover:bg-slate-100 border border-transparent',
		teal: 'bg-teal-500 text-white hover:bg-teal-600 border border-transparent'
	};

	const base =
		'inline-flex items-center justify-center gap-2 rounded-[12px] px-5 py-[13px] text-base font-semibold ' +
		'cursor-pointer transition-all duration-150 ease-[cubic-bezier(.22,1,.36,1)] active:scale-[0.97] ' +
		'disabled:opacity-50 disabled:pointer-events-none box-border';

	const Icon = $derived(icon);
</script>

{#if href}
	<a {href} class="{base} {variants[variant]} {full ? 'w-full' : ''} {klass}" {onclick}>
		{#if Icon}<Icon size={18} strokeWidth={2.2} />{/if}
		{@render children()}
	</a>
{:else}
	<button {type} {onclick} class="{base} {variants[variant]} {full ? 'w-full' : ''} {klass}">
		{#if Icon}<Icon size={18} strokeWidth={2.2} />{/if}
		{@render children()}
	</button>
{/if}
