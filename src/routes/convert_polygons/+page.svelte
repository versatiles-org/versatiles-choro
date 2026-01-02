<script lang="ts">
	import FileSelector from '$lib/component/FileSelector.svelte';
	import FileSaver from '$lib/component/FileSaver.svelte';
	import Progress from '$lib/component/Progress.svelte';

	let showInputModal = $state(true);
	let showOutputModal = $state(false);
	let inputFile: string | undefined = $state(undefined);
	let outputFile: string | undefined = $state(undefined);

	$effect(() => {
		if (inputFile && !outputFile) {
			showInputModal = false;
			showOutputModal = true;
		}
	});
</script>

{#if !inputFile}
	<h3>Select input file (GeoJSON):</h3>
	<button onclick={() => (showInputModal = true)}>Open File Selector</button>
	<FileSelector
		bind:showModal={showInputModal}
		bind:file={inputFile}
		fileFilter={(name) => /\.geojson$/.test(name)}
		title="Select Input File (GeoJSON)"
	/>
{/if}

{#if inputFile && !outputFile}
	<h3>Select output file location:</h3>
	<p>Input: {inputFile}</p>
	<button onclick={() => (showOutputModal = true)}>Choose Output Location</button>
	<FileSaver
		bind:showModal={showOutputModal}
		bind:filepath={outputFile}
		defaultFilename="output"
		defaultExtension=".versatiles"
		title="Save Output File"
	/>
{/if}

{#if inputFile && outputFile}
	<Progress url="/api/convert/polygons" params={{ input: inputFile, output: outputFile }} />
{/if}
