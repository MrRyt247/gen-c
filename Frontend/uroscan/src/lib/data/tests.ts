import type { SupabaseClient } from '@supabase/supabase-js';
import type { Test } from '$lib/types';
import { getMockTest, getMockTests } from '$lib/mock/data';

/**
 * Data access for tests. Every function takes the request-scoped Supabase client
 * (or `null` in demo mode) so the same call sites work with or without a backend.
 */

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

	if (error) throw error;
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

	if (error) throw error;
	return (data ?? []) as Test[];
}
