<script lang="ts">
	import PageContainer from '$lib/component/PageContainer.svelte';
	import Progress from '$lib/component/Progress.svelte';
	let running = $state(false);
</script>

<PageContainer title="Download Test Data">
	<div class="step-section">
		<h3>Get Sample Datasets</h3>
		<p>
			Download sample GeoJSON polygon data to test the choropleth mapping functionality. This will
			fetch test datasets and save them to your local filesystem.
		</p>
		<button onclick={() => (running = true)} disabled={running}>
			{running ? 'Downloading...' : 'Start Download'}
		</button>
	</div>

	{#if running}
		<Progress url="/api/download/test-data" params={{}} />
	{/if}
</PageContainer>
