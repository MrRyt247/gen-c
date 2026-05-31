<script lang="ts">
	import { onMount } from 'svelte';
	import { AlertTriangle, Clock, CalendarCheck, CheckCircle2, Sparkles, RefreshCw } from '@lucide/svelte';
	import type { MarkerResult, Status } from '$lib/types';
	import type { Recommendation } from '$lib/../routes/api/recommend/+server';

	let {
		results,
		status,
		testId
	}: { results: MarkerResult[]; status: Status; testId: string } = $props();

	type Phase = 'loading' | 'done' | 'error';
	let phase = $state<Phase>('loading');
	let rec = $state<Recommendation | null>(null);
	let errMsg = $state<string | null>(null);

	const CACHE_KEY = $derived(`uroscan-rec-${testId}`);

	async function fetchRecommendation() {
		phase = 'loading';
		errMsg = null;

		// Return early if a cached recommendation exists for this test.
		try {
			const cached = sessionStorage.getItem(CACHE_KEY);
			if (cached) {
				rec = JSON.parse(cached) as Recommendation;
				phase = 'done';
				return;
			}
		} catch {
			/* ignore storage errors */
		}

		try {
			const res = await fetch('/api/recommend', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ results, status })
			});

			if (!res.ok) {
				const msg = await res.text().catch(() => `HTTP ${res.status}`);
				throw new Error(msg.slice(0, 160));
			}

			rec = (await res.json()) as Recommendation;
			phase = 'done';

			try {
				sessionStorage.setItem(CACHE_KEY, JSON.stringify(rec));
			} catch {
				/* storage full */
			}
		} catch (e) {
			errMsg = e instanceof Error ? e.message : 'Could not fetch recommendation.';
			phase = 'error';
		}
	}

	onMount(fetchRecommendation);

	// ── Visual config per verdict / urgency ────────────────────────────────────

	interface VerdictStyle {
		border: string;
		bg: string;
		icon: typeof AlertTriangle;
		iconColor: string;
		label: string;
		labelBg: string;
		labelColor: string;
	}

	function verdictStyle(r: Recommendation): VerdictStyle {
		if (r.verdict === 'seek_care') {
			if (r.urgency === 'urgent') {
				return {
					border: 'var(--color-alert)',
					bg: 'var(--color-alert-bg)',
					icon: AlertTriangle,
					iconColor: 'var(--color-alert)',
					label: 'Urgent',
					labelBg: 'var(--color-alert)',
					labelColor: '#fff'
				};
			}
			if (r.urgency === 'soon') {
				return {
					border: '#f59e0b',
					bg: '#fffbeb',
					icon: Clock,
					iconColor: '#b45309',
					label: 'See a doctor soon',
					labelBg: '#f59e0b',
					labelColor: '#fff'
				};
			}
			return {
				border: 'var(--color-info)',
				bg: 'var(--color-info-bg)',
				icon: CalendarCheck,
				iconColor: 'var(--color-info)',
				label: 'Schedule a check-up',
				labelBg: 'var(--color-info)',
				labelColor: '#fff'
			};
		}
		if (r.verdict === 'monitor') {
			return {
				border: 'var(--color-watch)',
				bg: 'var(--color-watch-bg)',
				icon: Clock,
				iconColor: 'var(--color-watch)',
				label: 'Monitor & re-test',
				labelBg: 'var(--color-watch)',
				labelColor: '#fff'
			};
		}
		return {
			border: 'var(--color-normal)',
			bg: 'var(--color-normal-bg)',
			icon: CheckCircle2,
			iconColor: 'var(--color-normal)',
			label: 'Looking normal',
			labelBg: 'var(--color-normal)',
			labelColor: '#fff'
		};
	}
</script>

<!-- ── Loading skeleton ──────────────────────────────────────────────────── -->
{#if phase === 'loading'}
	<div
		class="mt-5 rounded-[20px] border p-5"
		style="border-color: var(--color-slate-200); background: var(--bg-app);"
	>
		<div class="flex items-center gap-2.5">
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
				style="background: var(--color-blue-50);"
			>
				<Sparkles size={16} style="color: var(--color-blue-500); animation: pulse 1.2s infinite;" />
			</div>
			<div class="flex-1">
				<div class="text-[13px] font-semibold text-slate-700">Getting AI recommendation…</div>
				<div class="mt-0.5 text-[12px] text-slate-400">Analysing your panel with Claude AI</div>
			</div>
		</div>
		<!-- Skeleton lines -->
		<div class="mt-4 space-y-2">
			{#each [80, 60, 70] as w}
				<div
					class="h-3 rounded-full"
					style="width: {w}%; background: var(--color-slate-200); animation: pulse 1.4s infinite;"
				></div>
			{/each}
		</div>
	</div>

<!-- ── Error state ───────────────────────────────────────────────────────── -->
{:else if phase === 'error'}
	<div
		class="mt-5 flex items-start gap-3 rounded-[16px] p-4"
		style="background: var(--bg-app); border: 1px solid var(--color-slate-200);"
	>
		<Sparkles size={16} class="mt-0.5 shrink-0 text-slate-300" />
		<div class="flex-1">
			<div class="text-[13px] text-slate-400">AI recommendation unavailable.</div>
			{#if errMsg && errMsg.length < 120}
				<div class="mt-0.5 text-[11px] text-slate-300">{errMsg}</div>
			{/if}
		</div>
		<button
			type="button"
			onclick={fetchRecommendation}
			aria-label="Retry"
			class="shrink-0 text-slate-400 hover:text-blue-500"
		>
			<RefreshCw size={14} />
		</button>
	</div>

<!-- ── Recommendation card ───────────────────────────────────────────────── -->
{:else if rec}
	{@const vs = verdictStyle(rec)}
	{@const Icon = vs.icon}

	<div
		class="animate-rise mt-5 rounded-[20px] p-5"
		style="background: {vs.bg}; border: 1.5px solid {vs.border};"
	>
		<!-- Header row -->
		<div class="flex items-start justify-between gap-3">
			<div class="flex items-start gap-3">
				<div
					class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm"
				>
					<Icon size={18} style="color: {vs.iconColor};" />
				</div>
				<div>
					<div class="text-[16px] font-bold leading-snug text-slate-900">{rec.headline}</div>
					<span
						class="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
						style="background: {vs.labelBg}; color: {vs.labelColor};"
					>
						{vs.label}
					</span>
				</div>
			</div>
		</div>

		<!-- Reasoning -->
		<p class="mt-3.5 text-[13.5px] leading-[1.55] text-slate-700">
			{rec.reasoning}
		</p>

		<!-- Next steps -->
		{#if rec.nextSteps.length}
			<div class="mt-4">
				<div class="eyebrow mb-2" style="color: {vs.iconColor};">What to do</div>
				<ul class="space-y-2">
					{#each rec.nextSteps as step, i (i)}
						<li class="flex items-start gap-2.5 text-[13px] text-slate-700">
							<span
								class="mono mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
								style="background: {vs.iconColor};"
							>
								{i + 1}
							</span>
							{step}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Claude attribution -->
		<div class="mt-4 flex items-center gap-1.5 border-t pt-3" style="border-color: {vs.border}20;">
			<Sparkles size={11} class="text-slate-400" />
			<span class="text-[11px] text-slate-400">Powered by Claude AI · Not a medical diagnosis</span>
		</div>
	</div>
{/if}
