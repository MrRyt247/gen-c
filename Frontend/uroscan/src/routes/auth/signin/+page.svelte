<script lang="ts">
	import { enhance } from '$app/forms';
	import { Mail, Lock } from '@lucide/svelte';
	import Button from '$lib/components/Button.svelte';

	let { form, data } = $props();

	const demo = $derived(data.demo);
	const isDemo = $derived(demo != null);
	let submitting = $state(false);
</script>

<svelte:head><title>Sign in · UroScan</title></svelte:head>

<div class="flex min-h-dvh flex-col justify-center px-6 py-12">
	<div class="mb-8 flex flex-col items-center text-center">
		<img src="/brand/uroscan-logo.svg" height="34" alt="UroScan" class="h-[34px]" />
		<p class="mt-5 text-[15px] leading-relaxed text-slate-500">
			Lab-grade urinalysis from a strip and your phone. Sign in to see your panel.
		</p>
	</div>

	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
		class="rounded-[16px] border border-slate-200 bg-white p-6 shadow-sm"
	>
		{#if form?.error}
			<p
				class="mb-4 rounded-[12px] px-3 py-2.5 text-[13px] font-medium"
				style="background: var(--color-alert-bg); color: var(--color-alert);"
			>
				{form.error}
			</p>
		{/if}

		<label class="mb-1.5 block text-sm font-semibold text-slate-900" for="email">Email</label>
		<div class="relative mb-4">
			<Mail size={18} class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
			<input
				id="email"
				name="email"
				type="email"
				autocomplete="email"
				value={form?.email ?? demo?.email ?? ''}
				placeholder="you@email.com"
				class="mono w-full rounded-[12px] border border-slate-200 bg-white py-3 pl-11 pr-3.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
			/>
		</div>

		<label class="mb-1.5 block text-sm font-semibold text-slate-900" for="password">Password</label>
		<div class="relative mb-5">
			<Lock size={18} class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
			<input
				id="password"
				name="password"
				type="password"
				autocomplete="current-password"
				value={isDemo ? 'demo-password' : ''}
				placeholder="••••••••"
				class="mono w-full rounded-[12px] border border-slate-200 bg-white py-3 pl-11 pr-3.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
			/>
		</div>

		<Button type="submit" full>
			{submitting ? 'Signing in…' : demo ? `Continue as ${demo.name.split(' ')[0]}` : 'Sign in'}
		</Button>
	</form>

	{#if isDemo}
		<p class="mt-4 text-center text-[12.5px] text-slate-400">
			Demo mode — no backend configured. Any details continue to the seeded account.
		</p>
	{:else}
		<p class="mt-5 text-center text-[13px] text-slate-500">
			New to UroScan?
			<a href="/auth/signup" class="font-semibold text-blue-600">Create an account</a>
		</p>
	{/if}

	<p class="mt-6 px-4 text-center text-[12px] leading-relaxed text-slate-400">
		UroScan flags and informs — it does not diagnose.
	</p>
</div>
