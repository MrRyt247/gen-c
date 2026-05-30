import type { SessionUser } from '$lib/types';

/**
 * Global auth state as a Svelte 5 runes singleton. The root layout seeds it from
 * server data and keeps it in sync with Supabase's onAuthStateChange.
 */
function createAuthStore() {
	let user = $state<SessionUser | null>(null);
	let loading = $state(true);

	return {
		get user() {
			return user;
		},
		get loading() {
			return loading;
		},
		get isAuthenticated() {
			return user !== null;
		},
		set(next: SessionUser | null) {
			user = next;
			loading = false;
		},
		setLoading(value: boolean) {
			loading = value;
		}
	};
}

export const authStore = createAuthStore();
