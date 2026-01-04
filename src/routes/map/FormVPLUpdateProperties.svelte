<script lang="ts">
	import type { VPLParamUpdateProperties } from '$lib/api/vpl';
	import FileSelector from '$lib/component/FileSelector.svelte';
	import Foldable from '$lib/component/SidebarFoldable.svelte';
	import type { FsFile } from '$lib/api/filesystem.svelte';
	import type { InferOutput } from 'valibot';

	let {
		params = $bindable()
	}: { params: InferOutput<typeof VPLParamUpdateProperties> | undefined } = $props();

	let active = $state(true);
	let showModal = $state(false);
	let selectedFile: FsFile | undefined = $state();
	let layer_name: string | undefined = $state();
	let id_field_tiles: string | undefined = $state();
	let id_field_data: string | undefined = $state();
	let replace_properties: boolean | undefined = $state();
	let remove_non_matching: boolean | undefined = $state();
	let include_id: boolean | undefined = $state();

	// Bindable output pattern: aggregate internal form state into params for parent
	$effect(() => {
		if (active && selectedFile && layer_name && id_field_tiles && id_field_data) {
			params = {
				data_source_path: selectedFile.fullPath(),
				layer_name,
				id_field_tiles,
				id_field_data,
				replace_properties,
				remove_non_matching,
				include_id
			};
		} else {
			params = undefined;
		}
	});
</script>

<Foldable title="Add data">
	<label>
		<input type="checkbox" bind:checked={active} />
		Active
	</label>
	<label class:label-error={!selectedFile}>
		Select Data File
		<button onclick={() => (showModal = true)}>Open File Selector</button>
		<FileSelector
			bind:showModal
			bind:file={selectedFile}
			fileFilter={(name) => /\.csv$/.test(name)}
		/>
	</label>
	<label class:label-error={!layer_name}>
		Layer Name
		<input type="text" class="input-full" bind:value={layer_name} />
	</label>
	<label class:label-error={!id_field_tiles}>
		ID Field (Tiles)
		<input type="text" class="input-full" bind:value={id_field_tiles} />
	</label>
	<label class:label-error={!id_field_data}>
		ID Field (Data)
		<input type="text" class="input-full" bind:value={id_field_data} />
	</label>
	<label>
		<input type="checkbox" bind:checked={replace_properties} />
		Replace Properties
	</label>
	<label>
		<input type="checkbox" bind:checked={remove_non_matching} />
		Remove Non-Matching Feature
	</label>
	<label>
		<input type="checkbox" bind:checked={include_id} />
		Include ID
	</label>
</Foldable>

<style>
	label {
		display: block;
		margin-bottom: 0.5rem;
	}
</style>
