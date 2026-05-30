<script lang="ts">
	import { enhance } from '$app/forms';
	import { User, Mail, Lock, MailCheck } from '@lucide/svelte';
	import Button from '$lib/components/Button.svelte';

	let { form, data } = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Create account · UroScan</title></svelte:head>

<div class="flex min-h-dvh flex-col justify-center px-6 py-12">
	<div class="mb-8 flex flex-col items-center text-center">
		<img src="/brand/uroscan-logo.svg" height="34" alt="UroScan" class="h-[34px]" />
		<p class="mt-5 text-[15px] leading-relaxed text-slate-500">
			Create your account to scan strips and track your panel over time.
		</p>
	</div>

	{#if form?.pending}
		<div class="rounded-[16px] border border-slate-200 bg-white p-6 text-center shadow-sm">
			<div
				class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
				style="background: var(--color-teal-100);"
			>
				<MailCheck size={24} color="var(--color-teal-600)" />
			</div>
			<h1 class="text-[18px] font-bold text-slate-900">Check your email</h1>
			<p class="mt-2 text-[14px] leading-relaxed text-slate-500">
				We sent a confirmation link to <span class="mono text-slate-700">{form.email}</span>. Open it,
				then sign in.
			</p>
			<div class="mt-5"><Button full href="/auth/signin">Go to sign in</Button></div>
		</div>
	{:else}
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

			<label class="mb-1.5 block text-sm font-semibold text-slate-900" for="name">Full name</label>
			<div class="relative mb-4">
				<User size={18} class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
				<input
					id="name"
					name="name"
					type="text"
					autocomplete="name"
					value={form?.name ?? ''}
					placeholder="Ama Mensah"
					class="w-full rounded-[12px] border border-slate-200 bg-white py-3 pl-11 pr-3.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
				/>
			</div>

			<label class="mb-1.5 block text-sm font-semibold text-slate-900" for="email">Email</label>
			<div class="relative mb-4">
				<Mail size={18} class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					value={form?.email ?? ''}
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
					autocomplete="new-password"
					placeholder="At least 8 characters"
					class="mono w-full rounded-[12px] border border-slate-200 bg-white py-3 pl-11 pr-3.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
				/>
			</div>

			<Button type="submit" full>{submitting ? 'Creating account…' : 'Create account'}</Button>
		</form>

		<p class="mt-5 text-center text-[13px] text-slate-500">
			Already have an account?
			<a href="/auth/signin" class="font-semibold text-blue-600">Sign in</a>
		</p>
	{/if}

	<p class="mt-6 px-4 text-center text-[12px] leading-relaxed text-slate-400">
		UroScan flags and informs — it does not diagnose.
	</p>
</div>
