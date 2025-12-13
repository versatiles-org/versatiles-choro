<script lang="ts">
	import Sidebar from './Sidebar.svelte';

	let { content }: { content?: string } = $props();
</script>

<Sidebar>
	{#if content}
		{@html content}
	{/if}
</Sidebar>
