<script lang="ts">
	import FileSelector from '$lib/component/FileSelector.svelte';
	import { getTileUrl } from '$lib/engine/engine.svelte';

	let showModal = $state(true);
	let file: string | null = $state(null);

	$effect(() => {
		if (file) {
			console.log('Selected file:', file);
			showModal = false;
		}
	});

	let tileUrl: string | null = $state(null);

	$effect(() => {
		if (file) {
			getTileUrl(file).then((url) => (tileUrl = url));
		} else {
			tileUrl = null;
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
{/if}

{#if tileUrl}
	<h3>Preview of selected tiles:</h3>
	<p>Tiles Preview: "{tileUrl}"</p>
{/if}
