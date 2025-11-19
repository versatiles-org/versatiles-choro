<script lang="ts">
	import FileSelector from '$lib/component/FileSelector.svelte';
	import Map from '$lib/component/Map.svelte';

	let showModal = $state(true);
	let file: string | null = $state(null);

	$effect(() => {
		if (file) showModal = false;
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
	<Map backgroundMap="GrayBright" overlayFile={file} inspectOverlay={true}></Map>
{/if}
