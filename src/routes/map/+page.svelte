<script lang="ts">
	import type { TilesInitRequest } from '$lib/api/types';
	import FileSelector from '$lib/component/FileSelector.svelte';
	import Foldable from '$lib/component/SidebarFoldable.svelte';
	import Map from '$lib/component/Map.svelte';
	import type { InferOutput } from 'valibot';
	import Frame from '$lib/component/SidebarFrame.svelte';
	import Sidebar from '$lib/component/Sidebar.svelte';
	import IconFile from '@lucide/svelte/icons/file';
	import IconVector from '@lucide/svelte/icons/hammer';
	import IconDesign from '@lucide/svelte/icons/paintbrush';

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
	<Sidebar>
		<Frame title="Input file" Icon={IconFile}>
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
		</Frame>
		<Frame title="Data Processing" Icon={IconVector}>
			<Foldable title="Add data"></Foldable>
			<Foldable title="Filter layers"></Foldable>
			<Foldable title="Filter properties"></Foldable>
			<Foldable title="Filter area"></Foldable>
			<Foldable title="Add Metadata"></Foldable>
			<button>Apply Changes</button>
		</Frame>
		<Frame title="Design" Icon={IconDesign} borderBottom={false}></Frame>
	</Sidebar>
	<div class="map-container">
		<Map backgroundMap="GrayBright" {overlay} inspectOverlay={true}></Map>
	</div>
</div>

<style>
	.wrapper {
		display: flex;
		height: 100%;
	}
	.map-container {
		flex: 1;
		position: relative;
	}
</style>
