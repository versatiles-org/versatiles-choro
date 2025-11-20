<script lang="ts">
	import type { TilesInitRequest } from '$lib/api/types';
	import FileSelector from '$lib/component/FileSelector.svelte';
	import Map from '$lib/component/Map.svelte';
	import type { InferOutput } from 'valibot';

	let showModal = $state(true);
	let file: string | undefined = $state(undefined);
	let overlay: InferOutput<typeof TilesInitRequest> | undefined = $state(undefined);

	$effect(() => {
		if (file) {
			showModal = false;
			overlay = { input: file };
		} else {
			showModal = true;
			overlay = undefined;
		}
	});
</script>

{#if !file}
	<h3>Select a tiles container:</h3>
	<button onclick={() => (showModal = true)}>Open File Selector</button>
	<FileSelector
		bind:showModal
		bind:file
		fileFilter={(name) => /\.(versa|mb|pm)tiles$/.test(name)}
	/>
{:else}
	<Map backgroundMap="GrayBright" {overlay} inspectOverlay={true}></Map>
{/if}
