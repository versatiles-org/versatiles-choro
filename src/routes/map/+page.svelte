<script lang="ts">
	import type { TilesInitRequest } from '$lib/api/schemas';
	import Map from '$lib/components/Map.svelte';
	import type { InferOutput } from 'valibot';
	import Frame from '$lib/components/SidebarFrame.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import IconFile from '@lucide/svelte/icons/file';
	import IconVector from '@lucide/svelte/icons/hammer';
	import IconDesign from '@lucide/svelte/icons/paintbrush';
	import {
		FormVPLFromContainer,
		FormVPLUpdateProperties,
		FormChoropleth
	} from '$lib/components/map/forms';
	import type { VPLParamFromContainer, VPLParamUpdateProperties } from '$lib/api/schemas';
	import { getTileSource, TileSource } from '$lib/components/map/tile-source';
	import type { TileJSONSpecificationVector } from '@versatiles/style';
	import type { ChoroplethParams } from '$lib/components/map/color-schemes';

	let from_container: InferOutput<typeof VPLParamFromContainer> | undefined = $state();
	let update_properties: InferOutput<typeof VPLParamUpdateProperties> | undefined = $state();
	let inspectOverlay: boolean = $state(true);
	let choropleth: ChoroplethParams | undefined = $state();

	let overlay_source: TileSource | undefined = $derived(
		from_container ? await getTileSource({ vpl: { from_container, update_properties } }) : undefined
	);

	let tilejson: TileJSONSpecificationVector | undefined = $derived(
		overlay_source?.tileJson ?? undefined
	);
</script>

<div class="wrapper">
	<Sidebar>
		<Frame title="Vector Data" Icon={IconFile}>
			<FormVPLFromContainer bind:params={from_container} />
		</Frame>
		<Frame title="Numeric Data" Icon={IconVector}>
			<FormVPLUpdateProperties bind:params={update_properties} {tilejson} />
		</Frame>
		<Frame title="Design" Icon={IconDesign} borderBottom={false}>
			<FormChoropleth
				bind:params={choropleth}
				{tilejson}
				layerName={update_properties?.layer_name}
			/>
			<label class="checkbox-label">
				<input type="checkbox" bind:checked={inspectOverlay} />
				Inspector Mode
			</label>
		</Frame>
	</Sidebar>
	<div class="map-container">
		<Map
			backgroundMap="GrayBright"
			{overlay_source}
			{inspectOverlay}
			{choropleth}
			choroplethLayerName={update_properties?.layer_name}
		></Map>
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
