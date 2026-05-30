<script lang="ts">
	import TabBar from '$lib/components/TabBar.svelte';
	let { children } = $props();
</script>

<!-- Tabbed screens scroll the page; the fixed tab bar floats over a safe gutter. -->
<div class="pt-2 pb-[120px]">
	{@render children()}
</div>

<TabBar />
