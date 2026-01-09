<script lang="ts">
	import Map from '$lib/components/Map.svelte';
	import type { InferOutput } from 'valibot';
	import Frame from '$lib/components/SidebarFrame.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import IconFile from '@lucide/svelte/icons/file';
	import IconVector from '@lucide/svelte/icons/hammer';
	import IconDesign from '@lucide/svelte/icons/paintbrush';
	import IconExport from '@lucide/svelte/icons/download';
	import {
		FormVPLFromContainer,
		FormVPLUpdateProperties,
		FormChoropleth
	} from '$lib/components/map/forms';
	import type { VPLParamFromContainer, VPLParamUpdateProperties } from '$lib/api/schemas';
	import { getTileSource, TileSource } from '$lib/components/map/tile-source';
	import type { TileJSONSpecificationVector } from '@versatiles/style';
	import type { ChoroplethParams } from '$lib/components/map/color-schemes';
	import FileSaver from '$lib/components/FileSaver.svelte';
	import Progress from '$lib/components/Progress.svelte';
	import type { ExportRequest } from '$lib/api/schemas';

	let from_container: InferOutput<typeof VPLParamFromContainer> | undefined = $state();
	let update_properties: InferOutput<typeof VPLParamUpdateProperties> | undefined = $state();
	let inspectOverlay: boolean = $state(true);
	let choropleth: ChoroplethParams | undefined = $state();

	let overlay_source: TileSource | undefined = $derived(
		from_container ? await getTileSource({ vpl: { from_container, update_properties } }) : undefined
	);

	let tilejson_raw: TileJSONSpecificationVector | undefined = $derived(
		from_container
			? ((await getTileSource({ vpl: { from_container } })).tileJson ?? undefined)
			: undefined
	);

	let tilejson_filtered: TileJSONSpecificationVector | undefined = $derived(
		overlay_source?.tileJson ?? undefined
	);

	// Export functionality
	let showExportDialog = $state(false);
	let exportPath: string | undefined = $state();

	// Determine if export is possible
	let canExport = $derived(
		from_container && choropleth && update_properties?.layer_name && tilejson_filtered
	);

	// Build export params when ready
	let exportParams: InferOutput<typeof ExportRequest> | undefined = $derived(
		exportPath && from_container && choropleth && update_properties?.layer_name && tilejson_filtered
			? {
					vpl: { from_container, update_properties },
					choropleth,
					layerName: update_properties.layer_name,
					backgroundStyle: 'GrayBright',
					outputPath: exportPath,
					tilejson: tilejson_filtered
				}
			: undefined
	);

	function handleExportComplete() {
		exportPath = undefined;
	}
</script>

<div class="wrapper">
	<Sidebar>
		<Frame title="Vector Data" Icon={IconFile}>
			<FormVPLFromContainer bind:params={from_container} />
		</Frame>
		<Frame title="Numeric Data" Icon={IconVector}>
			<FormVPLUpdateProperties bind:params={update_properties} tilejson={tilejson_raw} />
		</Frame>
		<Frame title="Design" Icon={IconDesign}>
			<FormChoropleth
				bind:params={choropleth}
				tilejson={tilejson_filtered}
				layerName={update_properties?.layer_name}
			/>
			<label class="checkbox-label">
				<input type="checkbox" bind:checked={inspectOverlay} />
				Inspector Mode
			</label>
		</Frame>
		<Frame title="Export" Icon={IconExport} borderBottom={false}>
			<button class="export-button" onclick={() => (showExportDialog = true)} disabled={!canExport}>
				<IconExport size={16} />
				Export Map
			</button>
			{#if !canExport}
				<p class="export-hint">Configure vector data, numeric data, and design to enable export.</p>
			{/if}
		</Frame>
	</Sidebar>
	<div class="map-container">
		<Map
			backgroundMap="GrayBright"
			{overlay_source}
			{inspectOverlay}
			{choropleth}
			choroplethLayerName={update_properties?.layer_name}
			tooltipTemplate={choropleth?.tooltipTemplate}
		></Map>
	</div>
</div>

<FileSaver
	bind:showModal={showExportDialog}
	bind:filepath={exportPath}
	defaultFilename="choropleth-export"
	defaultExtension=""
	title="Export Choropleth Map"
	confirmOverwrite={false}
/>

{#if exportParams}
	<Progress
		url="/api/export"
		title="Exporting Map"
		params={exportParams}
		onComplete={handleExportComplete}
	/>
{/if}

<style>
	.wrapper {
		display: flex;
		height: 100%;
	}
	.map-container {
		flex: 1;
		position: relative;
	}
	.export-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-primary-500);
		color: white;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 0.9rem;
		width: 100%;
		justify-content: center;
	}
	.export-button:hover:not(:disabled) {
		background: var(--color-primary-600);
	}
	.export-button:disabled {
		background: var(--color-bg-muted);
		color: var(--color-text-muted);
		cursor: not-allowed;
	}
	.export-hint {
		margin-top: 0.5rem;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}
</style>
