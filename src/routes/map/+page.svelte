<script lang="ts">
	import type { TilesInitRequest } from '$lib/api/requests';
	import Map from '$lib/component/Map.svelte';
	import type { InferOutput } from 'valibot';
	import Frame from '$lib/component/SidebarFrame.svelte';
	import Sidebar from '$lib/component/Sidebar.svelte';
	import IconFile from '@lucide/svelte/icons/file';
	import IconVector from '@lucide/svelte/icons/hammer';
	import IconDesign from '@lucide/svelte/icons/paintbrush';
	import FormVPLFromContainer from './FormVPLFromContainer.svelte';
	import FormVPLUpdateProperties from './FormVPLUpdateProperties.svelte';
	import type { VPLParamFromContainer, VPLParamUpdateProperties } from '$lib/api/vpl';
	import { getTileSource, TileSource } from '$lib/component/map/tile_source';
	import type { TileJSONSpecificationVector } from '@versatiles/style';

	let from_container: InferOutput<typeof VPLParamFromContainer> | undefined = $state();
	let update_properties: InferOutput<typeof VPLParamUpdateProperties> | undefined = $state();

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
		<Frame title="Design" Icon={IconDesign} borderBottom={false}></Frame>
	</Sidebar>
	<div class="map-container">
		<Map backgroundMap="GrayBright" {overlay_source} inspectOverlay={true}></Map>
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
