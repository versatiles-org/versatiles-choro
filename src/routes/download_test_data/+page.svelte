<script lang="ts">
	import Progress from '$lib/component/Progress.svelte';
	let running = $state(false);
</script>

<h3>Downloading test data</h3>
<button onclick={() => (running = true)}>Download</button>
{#if running}
	<Progress url="/api/download/test-data" params={{}} />
{/if}