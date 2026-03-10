<script lang="ts">
	import type { VPLParamFromContainer } from '$lib/api/schemas';
	import FileSelector from '$lib/components/FileSelector.svelte';
	import Foldable from '$lib/components/SidebarFoldable.svelte';
	import Hint from '$lib/components/Hint.svelte';
	import type { FsFile } from '$lib/api/filesystem.svelte';
	import type { InferOutput } from 'valibot';

	// eslint-disable-next-line no-useless-assignment
	let { params = $bindable() }: { params: InferOutput<typeof VPLParamFromContainer> | undefined } =
		$props();

	let showModal = $state(false);
	let selectedFile: FsFile | undefined = $state();

	// Bindable output pattern: aggregate internal form state into params for parent
	$effect(() => {
		if (selectedFile) {
			params = {
				filename: selectedFile.fullPath()
			};
		} else {
			params = undefined;
		}
	});
</script>

<Foldable title="Open Vector Tiles" open={true}>
	<label>
		Select Container File<Hint
			text="Choose a .versatiles, .mbtiles, or .pmtiles file containing vector tile data"
		/>:<br />
		{selectedFile ? selectedFile.getName() : ''}<br />
		<button class="button button-secondary" onclick={() => (showModal = true)}>Select File</button>
		<FileSelector
			bind:showModal
			bind:file={selectedFile}
			fileFilter={(name) => /\.(versa|mb|pm)tiles$/.test(name)}
		/>
	</label>
</Foldable>
