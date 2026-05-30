<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ChevronLeft, Share2, Calendar, CheckCircle2, ImageDown, FileDown } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import ResultPanel from '$lib/components/ResultPanel.svelte';
	import ClaudeRecommendation from '$lib/components/ClaudeRecommendation.svelte';
	import Button from '$lib/components/Button.svelte';
	import { formatDate, formatTime } from '$lib/utils/format';
	import type { Test, MarkerResult } from '$lib/types';

	let { data } = $props();

	let liveTest = $state<Test | null>(null);
	let liveResults = $state<MarkerResult[]>([]);
	let storageRead = $state(false);

	// `loading` is true only while a live scan is waiting for sessionStorage.
	const loading = $derived(data.scanLive && !storageRead);
	const test = $derived(data.scanLive ? liveTest : data.test);
	const results = $derived(data.scanLive ? liveResults : (data.results as MarkerResult[]));

	onMount(() => {
		if (!data.scanLive) return;
		try {
			const raw = sessionStorage.getItem('uroscan-live');
			if (!raw) {
				goto('/dashboard', { replaceState: true });
				return;
			}
			const parsed = JSON.parse(raw) as { test: Test; results: MarkerResult[] };
			liveTest = parsed.test;
			liveResults = parsed.results;
		} catch {
			goto('/dashboard', { replaceState: true });
		} finally {
			storageRead = true;
		}
	});

	function sampleLabel(iso: string): string {
		const h = new Date(iso).getHours();
		if (h < 12) return 'Morning sample';
		if (h < 17) return 'Afternoon sample';
		return 'Evening sample';
	}

	let exportTarget = $state<HTMLDivElement | undefined>();
	let exporting = $state<'image' | 'pdf' | null>(null);
	let saved = $state(false);

	// scan-live always has id='scan-live'; use created_at to distinguish individual scans.
	function tlKey(t: Test) {
		return `uroscan-tl-${t.id === 'scan-live' ? t.created_at : t.id}`;
	}

	$effect(() => {
		if (test) saved = Boolean(localStorage.getItem(tlKey(test)));
	});

	async function addToTimeline() {
		if (!test || saved) return;

		// Try Supabase first (scan-live needs inserting; persisted tests are already there).
		if (data.supabase && test.id === 'scan-live') {
			try {
				const newId = crypto.randomUUID();
				const { error: e1 } = await data.supabase.from('tests').insert({
					id: newId,
					user_id: data.user?.id,
					created_at: test.created_at,
					status: test.status,
					result_summary: test.result_summary,
					ai_insights: test.ai_insights,
					raw_analysis: test.raw_analysis
				});
				if (!e1) {
					await data.supabase.from('results').insert(
						results.map((r) => ({ ...r, id: crypto.randomUUID(), test_id: newId }))
					);
					localStorage.setItem(tlKey(test), '1');
					saved = true;
					toast.success('Saved to your timeline!');
					return;
				}
			} catch { /* fall through */ }
		} else if (test.id !== 'scan-live') {
			// Already persisted in Supabase — nothing to do.
			saved = true;
			localStorage.setItem(tlKey(test), '1');
			toast.success('Already in your timeline.');
			return;
		}

		// localStorage fallback
		try {
			const existing: unknown[] = JSON.parse(localStorage.getItem('uroscan-timeline') ?? '[]');
			existing.unshift({ test, results, savedAt: new Date().toISOString() });
			localStorage.setItem('uroscan-timeline', JSON.stringify(existing.slice(0, 50)));
			localStorage.setItem(tlKey(test), '1');
			saved = true;
			toast.success('Saved to your device timeline.');
		} catch {
			toast.error('Could not save — storage may be full.');
		}
	}

	function exportFilename(ext: string) {
		return `uroscan-${test?.created_at.slice(0, 10) ?? 'result'}.${ext}`;
	}

	async function exportImage() {
		if (!exportTarget || exporting) return;
		exporting = 'image';
		try {
			const { toPng } = await import('html-to-image');
			const dataUrl = await toPng(exportTarget, { cacheBust: true, pixelRatio: 2 });
			const a = document.createElement('a');
			a.href = dataUrl;
			a.download = exportFilename('png');
			a.click();
		} catch {
			toast.error('Could not export image.');
		} finally {
			exporting = null;
		}
	}

	async function exportPdf() {
		if (!exportTarget || exporting) return;
		exporting = 'pdf';
		try {
			const [{ toPng }, { default: jsPDF }] = await Promise.all([
				import('html-to-image'),
				import('jspdf')
			]);
			const dataUrl = await toPng(exportTarget, { cacheBust: true, pixelRatio: 2 });
			const img = new Image();
			img.src = dataUrl;
			await new Promise((r) => (img.onload = r));
			// Use content dimensions as page size so nothing is cropped.
			const w = img.naturalWidth / 2;
			const h = img.naturalHeight / 2;
			const pdf = new jsPDF({ orientation: h > w ? 'portrait' : 'landscape', unit: 'px', format: [w, h] });
			pdf.addImage(dataUrl, 'PNG', 0, 0, w, h);
			pdf.save(exportFilename('pdf'));
		} catch {
			toast.error('Could not export PDF.');
		} finally {
			exporting = null;
		}
	}

	function back() {
		if (history.length > 1) history.back();
		else location.assign('/dashboard');
	}

	async function share() {
		const text = `My UroScan panel — ${test?.result_summary}.`;
		if (navigator.share) {
			try {
				await navigator.share({ title: 'UroScan reading', text });
				return;
			} catch {
				/* user dismissed */
			}
		}
		try {
			await navigator.clipboard.writeText(text);
			toast.success('Copied to clipboard.');
		} catch {
			toast.success('Share link copied — your clinician can open the full panel.');
		}
	}
</script>

<svelte:head><title>Reading · UroScan</title></svelte:head>

{#if loading}
	<div class="flex min-h-[60dvh] items-center justify-center">
		<span class="text-sm text-slate-400">Loading result…</span>
	</div>
{:else if !test}
	<div class="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-5 text-center">
		<p class="text-sm text-slate-400">Result not found.</p>
		<Button variant="secondary" href="/dashboard">Back to dashboard</Button>
	</div>
{:else}
	<header class="flex items-center gap-2 px-4 pb-3.5 pt-2">
		<button
			type="button"
			onclick={back}
			aria-label="Back"
			class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white"
		>
			<ChevronLeft size={20} class="text-slate-600" />
		</button>
		<div class="flex-1">
			<div class="text-[17px] font-bold text-slate-900">{sampleLabel(test.created_at)}</div>
			<div class="mono text-xs text-slate-400">
				{formatDate(test.created_at)} · {formatTime(test.created_at)} · UroScan AI
			</div>
		</div>
	</header>

	<div bind:this={exportTarget} class="px-5">
		<ResultPanel
			status={test.status}
			{results}
			insights={test.ai_insights}
			animate
		/>

		{#if results.length}
			<ClaudeRecommendation {results} status={test.status} testId={test.id} />
		{/if}
	</div>

	<div class="mt-5 grid grid-cols-4 gap-2 px-5">
		<Button full variant="secondary" icon={Share2} onclick={share}>Share</Button>
		<Button full variant="secondary" icon={ImageDown} onclick={exportImage} class={exporting === 'image' ? 'opacity-60' : ''}>
			{exporting === 'image' ? '…' : 'Image'}
		</Button>
		<Button full variant="secondary" icon={FileDown} onclick={exportPdf} class={exporting === 'pdf' ? 'opacity-60' : ''}>
			{exporting === 'pdf' ? '…' : 'PDF'}
		</Button>
		<Button full icon={saved ? CheckCircle2 : Calendar} variant={saved ? 'secondary' : 'primary'} onclick={addToTimeline}>
			{saved ? 'Saved' : 'Save'}
		</Button>
	</div>
{/if}
