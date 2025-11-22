<script lang="ts">
	import type { VPLParamUpdateProperties } from '$lib/api/vpl';
	import FileSelector from '$lib/component/FileSelector.svelte';
	import Foldable from '$lib/component/SidebarFoldable.svelte';
	import type { InferOutput } from 'valibot';

	let {
		params = $bindable()
	}: { params: InferOutput<typeof VPLParamUpdateProperties> | undefined } = $props();

	let active = $state(true);
	let showModal = $state(false);
	let data_source_path: string | undefined = $state();
	let layer_name: string | undefined = $state();
	let id_field_tiles: string | undefined = $state();
	let id_field_data: string | undefined = $state();
	let replace_properties: boolean | undefined = $state();
	let remove_non_matching: boolean | undefined = $state();
	let include_id: boolean | undefined = $state();

	$effect(() => {
		if (active && data_source_path && layer_name && id_field_tiles && id_field_data) {
			params = {
				data_source_path,
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
	<label class={{missing: !data_source_path}}>
		Select Data File
		<button onclick={() => (showModal = true)}>Open File Selector</button>
		<FileSelector
			bind:showModal
			bind:file={data_source_path}
			fileFilter={(name) => /\.csv$/.test(name)}
		/>
	</label>
	<label class={{missing: !layer_name}}>
		Layer Name
		<input type="text" bind:value={layer_name} />
	</label>
	<label class={{missing: !id_field_tiles}}>
		ID Field (Tiles)
		<input type="text" bind:value={id_field_tiles} />
	</label>
	<label class={{missing: !id_field_data}}>
		ID Field (Data)
		<input type="text" bind:value={id_field_data} />
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
	label.missing {
		color: #c00;
	}
	label.missing input[type='text'] {
		border-color: #c00;
	}
	input[type='text'] {
		width: 100%;
	}
</style>