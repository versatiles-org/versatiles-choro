<script lang="ts">
	import type { VPLParamUpdateProperties } from '$lib/api/schemas';
	import FileSelector from '$lib/components/FileSelector.svelte';
	import Foldable from '$lib/components/SidebarFoldable.svelte';
	import Hint from '$lib/components/Hint.svelte';
	import type { FsFile } from '$lib/api/filesystem.svelte';
	import type { InferOutput } from 'valibot';
	import type { TileJSONSpecificationVector } from '@versatiles/style';

	let {
		// eslint-disable-next-line no-useless-assignment
		params = $bindable(),
		tilejson
	}: {
		params: InferOutput<typeof VPLParamUpdateProperties> | undefined;
		tilejson: TileJSONSpecificationVector | undefined;
	} = $props();

	let active = $state(false);
	let showModal = $state(false);
	let selectedFile: FsFile | undefined = $state();
	let layer_name: string | undefined = $state();
	let id_field_tiles: string | undefined = $state();
	let id_field_data: string | undefined = $state();
	let remove_non_matching: boolean | undefined = $state();
	let field_separator: string | undefined = $state();
	let decimal_separator: string | undefined = $state();

	// CSV field detection state
	let availableFields: string[] = $state([]);
	let loadingFields: boolean = $state(false);
	let fieldsError: string | undefined = $state();

	let layer_names: string[] = $derived.by(() => {
		return tilejson?.vector_layers.map((layer) => layer.id) ?? [];
	});

	// Auto-select when there's only one layer
	$effect(() => {
		if (layer_names.length === 1) {
			layer_name = layer_names[0];
		}
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
				remove_non_matching,
				field_separator,
				decimal_separator
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
			Select Data File<Hint
				text="Choose a CSV or TSV file with data to join to the vector tiles"
			/>:<br />
			{selectedFile ? selectedFile.getName() : ''}<br />
			<button class="button button-secondary" onclick={() => (showModal = true)}>Select File</button
			>
			<FileSelector
				bind:showModal
				bind:file={selectedFile}
				fileFilter={(name) => /\.[ct]sv$/.test(name)}
			/>
		</label>
		{#if selectedFile}
			<label>
				Field Separator<Hint
					text="How columns are separated in the data file. Auto-detect works in most cases."
				/>
				<select class="input-full" bind:value={field_separator}>
					<option value={undefined} selected>auto</option>
					<option value=",">comma (,)</option>
					<option value=";">semicolon (;)</option>
					<option value="\t">tab (\t)</option>
				</select>
			</label>
			<label>
				Decimal Separator<Hint
					text="Character used for decimal numbers (dot or comma). Auto-detect works in most cases."
				/>
				<select class="input-full" bind:value={decimal_separator}>
					<option value={undefined} selected>auto</option>
					<option value=".">dot (.)</option>
					<option value=",">comma (,)</option>
				</select>
			</label>
			{#if layer_names.length > 0}
				<label class:label-error={!layer_name}>
					Layer Name<Hint text="The vector tile layer to join data to" />
					<select class="input-full" bind:value={layer_name} disabled={layer_names.length === 1}>
						{#each layer_names as name, index (name)}
							<option value={name} selected={index === 0}>{name}</option>
						{/each}
					</select>
				</label>
			{/if}
			<label class:label-error={!id_field_tiles}>
				ID Field (Tiles)<Hint
					text="The field in the vector tiles used to match features with data rows"
				/>
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
				ID Field (Data)<Hint
					text="The column in the data file used to match rows with tile features"
				/>
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
				<input type="checkbox" bind:checked={remove_non_matching} />
				Remove Non-Matching Feature<Hint
					text="Remove geometry features that have no matching row in the data file"
				/>
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
