<script lang="ts">
	import PageContainer from '$lib/component/PageContainer.svelte';
	import FileSelector from '$lib/component/FileSelector.svelte';
	import FileSaver from '$lib/component/FileSaver.svelte';
	import Progress from '$lib/component/Progress.svelte';
	import type { FsFile } from '$lib/api/filesystem.svelte';

	let showInputModal = $state(false);
	let showOutputModal = $state(false);
	let inputFile: FsFile | undefined = $state(undefined);
	let outputFile: FsFile | undefined = $state(undefined);

	// Workflow orchestration: automatically transition to output modal after input file is selected
	$effect(() => {
		if (inputFile && !outputFile) {
			showInputModal = false;
			showOutputModal = true;
		}
	});
</script>

<PageContainer title="Convert Polygons to Vector Tiles">
	{#if !inputFile}
		<div class="step-section">
			<h3>Step 1: Select Input File</h3>
			<p>Choose a GeoJSON file containing polygon data to convert into optimized vector tiles.</p>
			<button onclick={() => (showInputModal = true)}>Select GeoJSON File</button>
		</div>
		<FileSelector
			bind:showModal={showInputModal}
			bind:file={inputFile}
			fileFilter={(name) => /\.geojson$/.test(name)}
			title="Select Input File (GeoJSON)"
		/>
	{/if}

	{#if inputFile && !outputFile}
		<div class="step-section">
			<h3>Step 2: Choose Output Location</h3>
			<div class="info-card">
				<p><strong>Input file:</strong> {inputFile}</p>
			</div>
			<p>Select where to save the generated vector tiles (.versatiles file).</p>
			<button onclick={() => (showOutputModal = true)}>Choose Output Location</button>
		</div>
		<FileSaver
			bind:showModal={showOutputModal}
			bind:filepath={outputFile}
			initialDirectory={inputFile.getDirectory()}
			defaultFilename={inputFile.getName().replace(/\.[^/.]+$/, '')}
			defaultExtension=".versatiles"
			title="Save Output File"
		/>
	{/if}

	{#if inputFile && outputFile}
		<Progress url="/api/convert/polygons" params={{ input: inputFile, output: outputFile }} />
	{/if}
</PageContainer>
