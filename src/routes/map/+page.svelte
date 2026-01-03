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

	let overlay: InferOutput<typeof TilesInitRequest> | undefined = $state(undefined);
	let from_container: InferOutput<typeof VPLParamFromContainer> | undefined = $state();
	let update_properties: InferOutput<typeof VPLParamUpdateProperties> | undefined = $state();

	$effect(() => {
		if (from_container) {
			overlay = { vpl: { from_container, update_properties } };
		} else {
			overlay = undefined;
		}
	});
</script>

<div class="wrapper">
	<Sidebar>
		<Frame title="Input file" Icon={IconFile}>
			<FormVPLFromContainer bind:params={from_container} />
		</Frame>
		<Frame title="Data Processing" Icon={IconVector}>
			<FormVPLUpdateProperties bind:params={update_properties} />
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
