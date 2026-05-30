import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import type { Test } from '$lib/types';
import { getMockTest, getMockTests } from '$lib/mock/data';

/**
 * Data access for tests. Every function takes the request-scoped Supabase client
 * (or `null` in demo mode) so the same call sites work with or without a backend.
 */

/**
 * True when the error means the schema hasn't been provisioned yet (migration
 * not run). We treat that as "no data" rather than a hard crash, so a freshly
 * configured project boots into empty states until `supabase/migrations` is applied.
 */
function isSchemaMissing(error: PostgrestError | null): boolean {
	if (!error) return false;
	return (
		error.code === '42P01' || // undefined_table
		error.code === 'PGRST205' || // table not in schema cache
		/schema cache|does not exist/i.test(error.message ?? '')
	);
}

export async function getRecentTests(
	supabase: SupabaseClient | null,
	userId: string,
	limit = 10
): Promise<Test[]> {
	if (!supabase) return getMockTests().slice(0, limit);

	const { data, error } = await supabase
		.from('tests')
		.select('id, created_at, status, result_summary, thumbnail_url')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(limit);

	if (error) {
		if (isSchemaMissing(error)) {
			console.warn('[uroscan] tests schema not found — run supabase/migrations. Returning empty.');
			return [];
		}
		throw error;
	}
	return (data ?? []) as Test[];
}

export async function getTestById(
	supabase: SupabaseClient | null,
	userId: string,
	id: string
): Promise<Test | null> {
	if (!supabase) return getMockTest(id);

	const { data, error } = await supabase
		.from('tests')
		.select('*, results(*)')
		.eq('id', id)
		.eq('user_id', userId)
		.single();

	if (error) {
		if (error.code === 'PGRST116') return null; // no rows
		if (isSchemaMissing(error)) return null;
		throw error;
	}
	return data as Test;
}

export async function getHistoryTests(
	supabase: SupabaseClient | null,
	userId: string,
	from: number,
	to: number
): Promise<Test[]> {
	if (!supabase) return getMockTests().slice(from, to + 1);

	const { data, error } = await supabase
		.from('tests')
		.select('id, created_at, status, result_summary, thumbnail_url, results(marker, value, status)')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.range(from, to);

	if (error) {
		if (isSchemaMissing(error)) {
			console.warn('[uroscan] tests schema not found — run supabase/migrations. Returning empty.');
			return [];
		}
		throw error;
	}
	return (data ?? []) as Test[];
}
