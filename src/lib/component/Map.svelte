<script lang="ts">
	import maplibre from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { onMount, onDestroy } from 'svelte';
	import type { InferOutput } from 'valibot';
	import type { TilesInitRequest } from '$lib/api/requests';
	import { createBackgroundStyle, type BackgroundMap } from './map/style_background';
	import { getTileSource } from './map/tile_source';
	import { overlayStyles } from './map/style';
	import { Inspector } from './map/inspector.svelte';

	// --- Props  --------------------------------------------------------------
	let {
		backgroundMap,
		inspectOverlay = false,
		overlay
	}: {
		backgroundMap?: BackgroundMap;
		inspectOverlay?: boolean;
		overlay?: InferOutput<typeof TilesInitRequest>;
	} = $props();

	// --- State ---------------------------------------------------------------
	let container: HTMLDivElement | null = null;
	let canvas: HTMLCanvasElement | null = null;
	let map: maplibre.Map | null = null;

	// Derived background style so changes to backgroundMap are reflected
	let backgroundStyle = $derived(createBackgroundStyle(backgroundMap));
	let inspector: Inspector | null = $state(null);

	// --- Lifecycle: onMount that auto-cleans ---------------------------------
	onMount(async () => {
		if (!container) return;
		let bounds: maplibre.LngLatBoundsLike = [-23.895, 34.9, 45.806, 71.352];

		map = new maplibre.Map({
			container,
			style: backgroundStyle,
			bounds
		});
		inspector = new Inspector(map);

		canvas = map.getCanvas();
	});

	// cleanup (runs automatically when dependencies change or component unmounts)
	onDestroy(() => {
		inspector?.detach();
		inspector = null;
		map?.remove();
		map = null;
	});

	// React to changes of backgroundMap (only when no overlay is active)
	$effect(() => {
		if (!map) return;
		if (!overlay) {
			inspector?.detach();
			map.setStyle(backgroundStyle);
			return;
		}

		// Overlay present: update style & inspection handlers
		updateOverlay();
	});

	async function updateOverlay() {
		if (!map || !overlay) return;

		const source = await getTileSource(overlay);
		const overlayStyle = source.getStyle();
		const overlayLayerIds = overlayStyle.layers?.map((layer) => layer.id) ?? [];
		const style = overlayStyles(backgroundStyle, overlayStyle);

		// Remove previous inspection handlers and apply new style
		inspector?.detach();

		if (inspectOverlay && overlayLayerIds.length > 0) {
			inspector?.attach(overlayLayerIds);
		}

		map.setStyle(style);
	}
</script>

<div bind:this={container} class="map-container"></div>
{#if inspectOverlay && inspector}
	<div id="info">
		{#each inspector.selectedProperties as properties, index (index)}
			<table>
				<tbody>
					{#each properties as prop, index (index)}
						<tr>
							<td>{prop.name}:</td>
							<td>{prop.value}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/each}
	</div>
{/if}

<style>
	.map-container {
		position: absolute;
		width: 100%;
		height: 100%;
		min-height: 300px;
	}
	#info {
		position: absolute;
		top: 0;
		left: 0;
		max-width: 300px;
		overflow: auto;
		background: rgba(255, 255, 255, 0.8);
		font-size: 10px;
		padding: 5px;
	}
	#info table {
		border-collapse: collapse;
		margin-bottom: 10px;
	}
	#info td {
		padding: 0px 5px;
		vertical-align: top;
	}
	#info td:first-child {
		text-align: left;
		font-weight: bold;
	}
</style>
