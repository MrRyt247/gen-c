// See https://svelte.dev/docs/kit/types#app.d.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SessionUser } from '$lib/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient | null;
			safeGetSession: () => Promise<{ session: unknown | null; user: SessionUser | null }>;
			session: unknown | null;
			user: SessionUser | null;
		}
		interface PageData {
			session?: unknown | null;
			user?: SessionUser | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
