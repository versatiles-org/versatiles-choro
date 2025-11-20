<script lang="ts">
	import type { TilesInitRequest } from '$lib/api/types';
	import FileSelector from '$lib/component/FileSelector.svelte';
	import Foldable from '$lib/component/Foldable.svelte';
	import Map from '$lib/component/Map.svelte';
	import type { InferOutput } from 'valibot';

	let showModal = $state(false);
	let file: string | undefined = $state(undefined);
	let overlay: InferOutput<typeof TilesInitRequest> | undefined = $state(undefined);

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		file;
		updateOverlay();
	});

	function updateOverlay() {
		overlay = getOverlay();
		function getOverlay(): InferOutput<typeof TilesInitRequest> | undefined {
			if (file) {
				return { input: file };
			}
			return undefined;
		}
	}
</script>

<div class="wrapper">
	<div class="sidebar">
		<Foldable title="Selected File" open={true}>
			{#if file}
				<p>{file}</p>
			{:else}
				<p>No file selected.</p>
			{/if}

			<button onclick={() => (showModal = true)}>Open File Selector</button>
			<FileSelector
				bind:showModal
				bind:file
				fileFilter={(name) => /\.(versa|mb|pm)tiles$/.test(name)}
			/>
		</Foldable>
		<Foldable title="Add data"></Foldable>
		<Foldable title="Filter layers"></Foldable>
		<Foldable title="Filter properties"></Foldable>
		<Foldable title="Filter area"></Foldable>
		<Foldable title="Add Metadata"></Foldable>
	</div>
	<div class="map-container">
		<Map backgroundMap="GrayBright" {overlay} inspectOverlay={true}></Map>
	</div>
</div>

<style>
	.wrapper {
		display: flex;
		height: 100%;
	}
	.sidebar {
		width: 300px;
		box-sizing: border-box;
		border-right: 1px solid var(--color-border, #ddd);
		background-color: var(--color-bg, #f8f9fa);
		overflow-y: auto;
	}
	.map-container {
		flex: 1;
		position: relative;
	}
</style>
