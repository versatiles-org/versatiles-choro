<script lang="ts">
	import type { VPLParamUpdateProperties } from '$lib/api/vpl';
	import FileSelector from '$lib/component/FileSelector.svelte';
	import Foldable from '$lib/component/SidebarFoldable.svelte';
	import type { FsFile } from '$lib/api/filesystem.svelte';
	import type { InferOutput } from 'valibot';
	import type { TileJSONSpecificationVector } from '@versatiles/style';

	let {
		params = $bindable(),
		tilejson
	}: {
		params: InferOutput<typeof VPLParamUpdateProperties> | undefined;
		tilejson: TileJSONSpecificationVector | undefined;
	} = $props();

	let active = $state(true);
	let showModal = $state(false);
	let selectedFile: FsFile | undefined = $state();
	let layer_name: string | undefined = $state();
	let id_field_tiles: string | undefined = $state();
	let id_field_data: string | undefined = $state();
	let replace_properties: boolean | undefined = $state();
	let remove_non_matching: boolean | undefined = $state();
	let include_id: boolean | undefined = $state();

	// CSV field detection state
	let availableFields: string[] = $state([]);
	let loadingFields: boolean = $state(false);
	let fieldsError: string | undefined = $state();

	let layer_names: string[] = $derived.by(() => {
		return tilejson?.vector_layers.map((layer) => layer.id) ?? [];
	});

	// Derive tile field names from selected layer in tilejson
	let availableTileFields: string[] = $derived.by(() => {
		if (!tilejson || !layer_name) return [];

		const selectedLayer = tilejson.vector_layers.find((layer) => layer.id === layer_name);

		if (!selectedLayer) return [];

		// Extract field names (keys) from the fields Record
		return Object.keys(selectedLayer.fields);
	});

	// Fetch CSV field names when file is selected
	$effect(() => {
		if (selectedFile) {
			loadingFields = true;
			fieldsError = undefined;

			fetch('/api/csv/fields', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ filePath: selectedFile.fullPath() })
			})
				.then(async (res) => {
					if (!res.ok) {
						throw new Error(`Failed to fetch fields: ${res.statusText}`);
					}
					return res.json();
				})
				.then((data) => {
					availableFields = data.fields;
					loadingFields = false;
				})
				.catch((err) => {
					fieldsError = err.message;
					loadingFields = false;
					availableFields = [];
				});
		} else {
			availableFields = [];
			loadingFields = false;
			fieldsError = undefined;
			id_field_data = undefined;
		}
	});

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

<Foldable title="Add Data" open={true}>
	<label>
		<input type="checkbox" bind:checked={active} />
		Active
	</label>
	{#if !active}
		<p class="text-sm text-gray-500 italic">Inactive - no data will be added.</p>
	{:else}
		<label class:label-error={!selectedFile}>
			Select Data File:<br />
			{selectedFile ? selectedFile.getName() : ''}<br />
			<button onclick={() => (showModal = true)}>Select File</button>
			<FileSelector
				bind:showModal
				bind:file={selectedFile}
				fileFilter={(name) => /\.[ct]sv$/.test(name)}
			/>
		</label>
		{#if selectedFile}
			{#if layer_names}
				<label class:label-error={!layer_name}>
					Layer Name
					<select class="input-full" bind:value={layer_name}>
						{#each layer_names as name, index (name)}
							<option value={name} selected={index === 0}>{name}</option>
						{/each}
					</select>
				</label>
			{/if}
			<label class:label-error={!id_field_tiles}>
				ID Field (Tiles)
				{#if availableTileFields.length > 0}
					<select class="input-full" bind:value={id_field_tiles}>
						<option value="">-- Select field --</option>
						{#each availableTileFields as field (field)}
							<option value={field}>{field}</option>
						{/each}
					</select>
				{:else}
					<span class="text-sm text-gray-500 italic">No fields available for selected layer.</span>
				{/if}
			</label>
			<label class:label-error={!id_field_data}>
				ID Field (Data)
				{#if loadingFields}
					<span class="text-sm text-gray-500 italic">Loading fields...</span>
				{:else if fieldsError}
					<span class="text-sm text-red-600">Error: {fieldsError}</span>
					<input type="text" class="input-full" bind:value={id_field_data} />
				{:else if availableFields.length > 0}
					<select class="input-full" bind:value={id_field_data}>
						<option value="">-- Select field --</option>
						{#each availableFields as field (field)}
							<option value={field}>{field}</option>
						{/each}
					</select>
				{:else}
					<input type="text" class="input-full" bind:value={id_field_data} />
				{/if}
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
		{/if}
	{/if}
</Foldable>

<style>
	label {
		display: block;
		margin-bottom: 0.5rem;
	}
</style>
