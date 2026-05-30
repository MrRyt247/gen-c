<script lang="ts">
	let {
		data,
		color = 'var(--color-blue-500)',
		band,
		w = 320,
		h = 120
	}: { data: number[]; color?: string; band?: [number, number]; w?: number; h?: number } = $props();

	const stats = $derived.by(() => {
		const max = Math.max(...data) * 1.15;
		const min = Math.min(...data) * 0.85;
		const range = max - min || 1;
		const x = (i: number) => (i / (data.length - 1 || 1)) * w;
		const y = (v: number) => h - ((v - min) / range) * h;
		const path = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
		return { x, y, path, area: `${path} L${w} ${h} L0 ${h} Z` };
	});

	const uid = $props.id();
</script>

<svg width="100%" viewBox="0 0 {w} {h}" style="display:block; overflow:visible;">
	<defs>
		<linearGradient id="tg-{uid}" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color={color} stop-opacity="0.18" />
			<stop offset="100%" stop-color={color} stop-opacity="0" />
		</linearGradient>
	</defs>
	{#if band}
		<rect
			x="0"
			y={stats.y(band[1])}
			width={w}
			height={stats.y(band[0]) - stats.y(band[1])}
			fill="var(--color-normal-bg)"
			opacity="0.6"
		/>
	{/if}
	<path d={stats.area} fill="url(#tg-{uid})" />
	<path
		d={stats.path}
		fill="none"
		stroke={color}
		stroke-width="2.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
	{#if data.length}
		<circle
			cx={stats.x(data.length - 1)}
			cy={stats.y(data[data.length - 1])}
			r="4.5"
			fill={color}
			stroke="#fff"
			stroke-width="2.5"
		/>
	{/if}
</svg>
