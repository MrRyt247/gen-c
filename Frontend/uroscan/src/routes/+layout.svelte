<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { invalidate } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';

	let { data, children } = $props();

	// Seed global auth state from the server-resolved user.
	$effect(() => {
		authStore.set(data.user ?? null);
	});

	// When Supabase is live, re-run loaders on any auth change so SSR + client agree.
	$effect(() => {
		const supabase = data.supabase;
		if (!supabase) return;

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, newSession) => {
			if (newSession?.expires_at !== (data.session as { expires_at?: number })?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<Toaster
	position="top-center"
	richColors
	theme={themeStore.dark ? 'dark' : 'light'}
	toastOptions={{ style: 'font-family: var(--font-sans);' }}
/>

<div class="app-shell">
	{@render children()}
</div>
