<script lang="ts">
	import type { TileJSONSpecificationVector } from '@versatiles/style';
	import Hint from '$lib/components/Hint.svelte';
	import {
		COLOR_SCHEME_NAMES,
		type ColorSchemeName,
		type ChoroplethParams
	} from '../color-schemes';

	let {
		// eslint-disable-next-line no-useless-assignment
		params = $bindable(),
		tilejson,
		layerName
	}: {
		params: ChoroplethParams | undefined;
		tilejson: TileJSONSpecificationVector | undefined;
		layerName: string | undefined;
	} = $props();

	let active = $state(false);
	let field: string | undefined = $state();
	let colorScheme: ColorSchemeName = $state('viridis');
	let min: number = $state(0);
	let max: number = $state(100);
	let tooltipTemplate: string = $state('');

	// Derive available numeric fields from the selected layer
	let availableFields: string[] = $derived.by(() => {
		if (!tilejson || !layerName) return [];

		const selectedLayer = tilejson.vector_layers.find((layer) => layer.id === layerName);
		if (!selectedLayer) return [];

		// Return all field names - in practice, user should select numeric fields
		return Object.keys(selectedLayer.fields);
	});

	// Reset field when layer changes
	$effect(() => {
		if (layerName) {
			// Reset field selection when layer changes
			field = undefined;
		}
	});

	// Bindable output pattern: aggregate internal form state into params for parent
	$effect(() => {
		if (active && field && colorScheme && min !== undefined && max !== undefined) {
			params = {
				field,
				colorScheme,
				min,
				max,
				tooltipTemplate: tooltipTemplate || undefined
			};
		} else {
			params = undefined;
		}
	});
</script>

<div class="choropleth-form">
	<label>
		<input type="checkbox" bind:checked={active} />
		Enable Choropleth<Hint text="Color map regions based on numeric data values" />
	</label>

	{#if active}
		{#if !layerName}
			<p class="hint">Select a layer in "Numeric Data" first.</p>
		{:else if availableFields.length === 0}
			<p class="hint">No fields available for layer "{layerName}".</p>
		{:else}
			<label>
				Value Field<Hint text="The numeric data field to use for coloring regions" />
				<select class="input-full" bind:value={field}>
					<option value={undefined}>-- Select field --</option>
					{#each availableFields as f (f)}
						<option value={f}>{f}</option>
					{/each}
				</select>
			</label>

			<label>
				Color Scheme<Hint text="The color gradient applied to map the data values" />
				<select class="input-full" bind:value={colorScheme}>
					{#each COLOR_SCHEME_NAMES as scheme (scheme)}
						<option value={scheme}>{scheme}</option>
					{/each}
				</select>
			</label>

			<div class="min-max-row">
				<label>
					Min<Hint text="Minimum data value for the color scale" />
					<input type="number" class="input-full" bind:value={min} step="any" />
				</label>
				<label>
					Max<Hint text="Maximum data value for the color scale" />
					<input type="number" class="input-full" bind:value={max} step="any" />
				</label>
			</div>

			<label>
				Tooltip Template<Hint
					text="HTML template for hover tooltips. Use {'{property}'} placeholders."
				/>
				<textarea
					class="input-full tooltip-textarea"
					bind:value={tooltipTemplate}
					placeholder={'<b>{name}</b><br>Value: {value}'}
					rows="3"
				></textarea>
				<span class="hint">Use {'{property}'} to insert feature values</span>
			</label>
		{/if}
	{/if}
</div>

<style>
	.choropleth-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		display: block;
	}

	.hint {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		font-style: italic;
		margin: 0;
	}

	.min-max-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.tooltip-textarea {
		font-family: monospace;
		font-size: 0.875rem;
		resize: vertical;
	}
</style>
