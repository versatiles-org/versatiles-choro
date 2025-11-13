<script lang="ts">
	import FileSelector from '$lib/component/FileSelector.svelte';
	import Progress from '$lib/component/Progress.svelte';

	let showModal = $state(true);
	let file: string | null = $state(null);

	$effect(() => {
		if (file) {
			console.log('Selected file:', file);
			showModal = false;
		}
	});
</script>

{#if !file}
	<h3>Select a data source:</h3>
	<button onclick={() => (showModal = true)}>Open File Selector</button>
	<FileSelector bind:showModal bind:file fileFilter={(name) => /\.geojson$/.test(name)} />
{/if}

{#if file}
	<Progress
		url="/api/convert_polygons_to_versatiles"
		params={{ input: file, output: file + '.versatiles' }}
	/>
{/if}
