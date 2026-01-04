<script lang="ts">
	import PageContainer from '$lib/component/PageContainer.svelte';
	import Progress from '$lib/component/Progress.svelte';
	let running = $state(false);
	let success = $state(false);

	function handleDownloadComplete() {
		running = false;
		success = true;
		// Reset success state after 3 seconds
		setTimeout(() => {
			success = false;
		}, 3000);
	}
</script>

<PageContainer title="Download Test Data">
	<div class="step-section">
		<h3>Get Sample Datasets</h3>
		<p>
			Download sample GeoJSON polygon data to test the choropleth mapping functionality. This will
			fetch test datasets and save them to your local filesystem.
		</p>
		<button class:success onclick={() => (running = true)} disabled={running}>
			{#if running}
				Downloading...
			{:else if success}
				✓ Downloaded Successfully
			{:else}
				Start Download
			{/if}
		</button>
	</div>

	{#if running}
		<Progress
			url="/api/download/test-data"
			title="Download Progress"
			onComplete={handleDownloadComplete}
		/>
	{/if}
</PageContainer>

<style>
	button.success {
		background: hsl(140, 60%, 45%) !important;
	}

	button.success:hover {
		background: hsl(140, 60%, 40%) !important;
	}
</style>
