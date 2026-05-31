<script lang="ts">
	import TabBar from '$lib/components/TabBar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	let { children } = $props();
</script>

<Sidebar />

<div class="pt-2 pb-[120px] lg:ml-[240px] lg:pb-10">
	<div class="lg:mx-auto lg:max-w-4xl">
		{@render children()}
	</div>
</div>

<TabBar />
