<script lang="ts">
	import { goto } from '$app/navigation';
	import { X, Camera, ImageUp } from '@lucide/svelte';
	import { prepareImage, sampleBox } from '$lib/scan/sample';
	import { buildPanel, markerDetections, summarize } from '$lib/scan/analyze';
	import { CLASS_TO_MARKER } from '$lib/scan/chart';
	import type { SampledPad } from '$lib/scan/analyze';
	import type { Test, MarkerResult } from '$lib/types';

	let { data } = $props();

	// -1 = capture UI, 0 = align, 1 = reading, 2 = analyzing
	let phase = $state(-1);
	let lit = $state(0);
	let scanError = $state<string | null>(null);
	let cameraInput = $state<HTMLInputElement | undefined>();
	let uploadInput = $state<HTMLInputElement | undefined>();

	const padColors = [
		'#e9d24a', '#7cae5d', '#3f7bb6', '#caa15a', '#b85c8a',
		'#8a9a3c', '#d98c5f', '#6fae9c', '#c2607a', '#9a7bc0'
	];

	const heading = $derived(
		phase === 0 ? 'Align the strip' : phase === 1 ? 'Reading…' : 'Analyzing'
	);

	function cancel() {
		goto('/dashboard', { replaceState: true });
	}

	async function onFileSelected(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		input.value = '';
		scanError = null;
		await runScan(file);
	}

	async function runScan(file: File) {
		phase = 0;
		lit = 0;

		const ANIM_TOTAL = 3900;
		const animStart = Date.now();

		// Kick off the visual animation sequence.
		const t1 = setTimeout(() => (phase = 1), 900);
		const t2 = setTimeout(() => (phase = 2), 2600);
		let litIv: ReturnType<typeof setInterval> | null = null;
		const litT = setTimeout(() => {
			litIv = setInterval(() => (lit = Math.min(lit + 1, padColors.length)), 150);
		}, 900);

		type LiveResult = { test: Test; results: MarkerResult[] };
		let scanData: LiveResult | null = null;
		let scanErr: string | null = null;

		try {
			if (data.roboflowConfigured) {
				// ── Real pipeline ───────────────────────────────────────────────────
				const prepared = await prepareImage(file);

				const res = await fetch('/api/scan', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ image: prepared.dataUrl })
				});

				if (!res.ok) {
					const msg = await res.text().catch(() => `HTTP ${res.status}`);
					throw new Error(msg.slice(0, 200));
				}

				const rf = await res.json();
				const detections = markerDetections(rf.predictions ?? []);

				if (!detections.length) {
					throw new Error(
						'No strip markers detected. Place the strip flat in bright, even light and try again.'
					);
				}

				const sampledPads: SampledPad[] = detections.map((d) => ({
					marker: CLASS_TO_MARKER[d.class],
					rgb: sampleBox(prepared.ctx, d),
					detectionConfidence: d.confidence
				}));

				const results = buildPanel(sampledPads);
				const { summary, insights } = summarize(results);

				const overall =
					results.some((r) => r.status === 'abnormal')
						? ('abnormal' as const)
						: results.some((r) => r.status === 'borderline')
							? ('borderline' as const)
							: ('normal' as const);

				const test: Test = {
					id: 'scan-live',
					user_id: data.user?.id ?? 'demo',
					created_at: new Date().toISOString(),
					status: overall,
					result_summary: summary,
					ai_insights: insights,
					thumbnail_url: null,
					image_url: null,
					raw_analysis: { engine: 'uroscan-roboflow', detections: detections.length },
					results
				};

				scanData = { test, results };
			} else {
				// ── Demo / dev fallback ─────────────────────────────────────────────
				// No Roboflow key configured — use the pre-baked mock result from the server.
				if (!data.demoScan) throw new Error('Demo scan data unavailable.');

				// Simulate a brief processing pause so the animation feels real.
				await new Promise((r) => setTimeout(r, 1400));

				const results = data.demoScan.results.map((r) => ({ ...r, test_id: 'scan-live' }));
				const test: Test = {
					...data.demoScan.test,
					id: 'scan-live',
					created_at: new Date().toISOString(),
					results
				};

				scanData = { test, results };
			}
		} catch (e) {
			scanErr = e instanceof Error ? e.message : 'Analysis failed — please try again.';
		}

		// Wait for the full animation to finish before navigating.
		const elapsed = Date.now() - animStart;
		if (elapsed < ANIM_TOTAL) {
			await new Promise((r) => setTimeout(r, ANIM_TOTAL - elapsed));
		}

		clearTimeout(t1);
		clearTimeout(t2);
		clearTimeout(litT);
		if (litIv !== null) clearInterval(litIv);

		if (scanErr || !scanData) {
			phase = -1;
			scanError = scanErr ?? 'Something went wrong — please try again.';
			return;
		}

		try {
			sessionStorage.setItem('uroscan-live', JSON.stringify(scanData));
		} catch {
			/* storage unavailable — results page falls back gracefully */
		}

		goto('/results/scan-live', { replaceState: true });
	}
</script>

<svelte:head><title>Scan · UroScan</title></svelte:head>

<!-- Camera input: opens rear camera directly on mobile. -->
<input
	bind:this={cameraInput}
	type="file"
	accept="image/*"
	capture="environment"
	class="sr-only"
	onchange={onFileSelected}
/>
<!-- Upload input: opens file picker / gallery (no capture constraint). -->
<input
	bind:this={uploadInput}
	type="file"
	accept="image/*"
	class="sr-only"
	onchange={onFileSelected}
/>

{#if phase === -1}
	<!-- ── Capture phase ────────────────────────────────────────────────────── -->
	<div class="animate-fade flex min-h-dvh flex-col px-5 pb-10 pt-14">
		<div class="flex items-center justify-between">
			<button
				type="button"
				onclick={cancel}
				aria-label="Cancel"
				class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white"
			>
				<X size={20} class="text-slate-600" />
			</button>
			<span class="text-[17px] font-bold text-slate-900">Scan strip</span>
			<div class="w-10"></div>
		</div>

		<div class="flex flex-1 flex-col items-center justify-center gap-5">
			<!-- Primary action: camera -->
			<button
				type="button"
				onclick={() => cameraInput?.click()}
				class="flex w-full max-w-[300px] items-center gap-4 rounded-[20px] bg-white px-5 py-5 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
				style="border: 1.5px solid var(--color-slate-200);"
			>
				<div
					class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
					style="background: var(--color-blue-50);"
				>
					<Camera size={24} style="color: var(--color-blue-500);" />
				</div>
				<div class="text-left">
					<div class="text-[15px] font-semibold text-slate-900">Take a photo</div>
					<div class="mt-0.5 text-[13px] text-slate-400">Open camera to capture the strip</div>
				</div>
			</button>

			<!-- Secondary action: upload from gallery / files -->
			<button
				type="button"
				onclick={() => uploadInput?.click()}
				class="flex w-full max-w-[300px] items-center gap-4 rounded-[20px] bg-white px-5 py-5 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
				style="border: 1.5px solid var(--color-slate-200);"
			>
				<div
					class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
					style="background: var(--color-teal-100);"
				>
					<ImageUp size={24} style="color: var(--color-teal-600);" />
				</div>
				<div class="text-left">
					<div class="text-[15px] font-semibold text-slate-900">Upload image</div>
					<div class="mt-0.5 text-[13px] text-slate-400">Choose from gallery or files</div>
				</div>
			</button>

			<!-- Tips card -->
			<div
				class="w-full max-w-[300px] rounded-[18px] bg-white p-4 shadow-sm"
				style="border: 1px solid var(--color-slate-100);"
			>
				<div class="eyebrow mb-2.5" style="color: var(--color-blue-500);">For best results</div>
				<ul class="space-y-2 text-[13px] text-slate-500">
					<li class="flex gap-2">
						<span class="mt-[1px] shrink-0 font-bold" style="color: var(--color-teal-500);">·</span>
						Lay the strip flat on the colour reference card
					</li>
					<li class="flex gap-2">
						<span class="mt-[1px] shrink-0 font-bold" style="color: var(--color-teal-500);">·</span>
						Use bright, even lighting — no direct flash
					</li>
					<li class="flex gap-2">
						<span class="mt-[1px] shrink-0 font-bold" style="color: var(--color-teal-500);">·</span>
						Keep the strip centred and in focus
					</li>
					<li class="flex gap-2">
						<span class="mt-[1px] shrink-0 font-bold" style="color: var(--color-teal-500);">·</span>
						Wait 2 min after dipping before scanning
					</li>
				</ul>
			</div>

			{#if scanError}
				<div
					class="w-full max-w-[300px] rounded-[14px] p-4"
					style="background: var(--color-alert-bg); border: 1px solid #fca5a5;"
				>
					<p class="text-[13px] leading-relaxed text-red-700">{scanError}</p>
					<div class="mt-2 flex gap-3">
						<button
							type="button"
							onclick={() => cameraInput?.click()}
							class="text-[13px] font-semibold text-red-600 underline underline-offset-2"
						>Camera</button>
						<span class="text-red-300">·</span>
						<button
							type="button"
							onclick={() => uploadInput?.click()}
							class="text-[13px] font-semibold text-red-600 underline underline-offset-2"
						>Upload</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<!-- ── Scanning animation (phases 0 → 1 → 2) ─────────────────────────── -->
	<div
		class="animate-fade absolute inset-0 z-50 flex flex-col"
		style="background: var(--color-slate-900);"
	>
		<!-- top bar -->
		<div class="flex items-center justify-between px-5 pt-14">
			<button
				type="button"
				onclick={cancel}
				aria-label="Cancel scan"
				class="flex h-10 w-10 items-center justify-center rounded-full border-none"
				style="background: rgb(255 255 255 / 0.14);"
			>
				<X size={20} color="#fff" />
			</button>
			<span class="text-sm font-semibold" style="color: rgb(255 255 255 / 0.85);">{heading}</span>
			<div class="w-10"></div>
		</div>

		<!-- scan stage -->
		<div class="flex flex-1 flex-col items-center justify-center">
			<div
				class="relative flex h-[300px] w-[230px] items-center justify-center overflow-hidden rounded-[24px]"
				style="background: #0a1422;"
			>
				<!-- strip -->
				<div class="flex h-[230px] w-[54px] flex-col gap-1 rounded-[9px] bg-white p-[7px]">
					{#each padColors as p, i (i)}
						<div
							class="flex-1 rounded-[3px]"
							style="background: {p};
								opacity: {phase === 0 ? 0.55 : i < lit ? 1 : 0.55};
								box-shadow: {phase === 1 && i < lit ? '0 0 12px 1px var(--color-teal-400)' : 'none'};
								transition: all 0.3s ease;"
						></div>
					{/each}
				</div>

				<!-- scan beam -->
				{#if phase === 1}
					<div
						class="absolute inset-x-0 h-[3px]"
						style="background: var(--color-teal-400);
							   box-shadow: 0 0 16px 3px var(--color-teal-400);
							   animation: scanbeam 1.7s linear;"
					></div>
				{/if}

				<!-- framing corners -->
				{#each [['top-3.5 left-3.5', '6px 0 0 0', 'border-r-0 border-b-0'], ['top-3.5 right-3.5', '0 6px 0 0', 'border-l-0 border-b-0'], ['bottom-3.5 left-3.5', '0 0 0 6px', 'border-r-0 border-t-0'], ['bottom-3.5 right-3.5', '0 0 6px 0', 'border-l-0 border-t-0']] as [pos, radius, sides] (pos)}
					<div
						class="absolute h-[26px] w-[26px] border-[3px] {pos} {sides}"
						style="border-color: var(--color-teal-400); border-radius: {radius};"
					></div>
				{/each}
			</div>

			{#if phase === 2}
				<div
					class="animate-fade mt-[30px] flex items-center gap-2.5 rounded-full px-4 py-2.5"
					style="background: rgb(45 212 196 / 0.16);"
				>
					<span
						class="h-2 w-2 rounded-full"
						style="background: var(--color-teal-400); animation: pulse 1s infinite;"
					></span>
					<span class="mono text-[13px]" style="color: var(--color-teal-400);">Reading 10 markers…</span>
				</div>
			{:else}
				<p class="mt-[30px] max-w-[240px] text-center text-sm" style="color: rgb(255 255 255 / 0.6);">
					{phase === 0
						? 'Place the dipped strip flat inside the frame.'
						: 'Hold steady — keep the strip in view.'}
				</p>
			{/if}
		</div>
	</div>
{/if}
