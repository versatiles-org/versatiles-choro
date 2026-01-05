<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { InferOutput } from 'valibot';
	import type { TilesInitRequest } from '$lib/api/schemas';
	import { createBackgroundStyle, type BackgroundMap } from './map/style-background';
	import { getTileSource, TileSource } from './map/tile-source';
	import { overlayStyles } from './map/style';
	import { Inspector } from './map/Inspector.svelte.ts';

	// --- Props  --------------------------------------------------------------
	let {
		backgroundMap,
		inspectOverlay = false,
		overlay_source
	}: {
		backgroundMap?: BackgroundMap;
		inspectOverlay?: boolean;
		overlay_source?: TileSource;
	} = $props();

	// --- State ---------------------------------------------------------------
	let container: HTMLDivElement | null = null;
	let canvas: HTMLCanvasElement | null = null;
	let map: import('maplibre-gl').Map | null = null;
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);

	// Derived background style so changes to backgroundMap are reflected
	let backgroundStyle = $derived(createBackgroundStyle(backgroundMap));
	let inspector: Inspector | null = $state(null);

	// --- Lifecycle: onMount that auto-cleans ---------------------------------
	onMount(async () => {
		try {
			if (!container) return;

			isLoading = true;

			// Dynamic import - loads MapLibre only when component mounts
			const maplibreModule = await import('maplibre-gl');
			const maplibre = maplibreModule.default;

			const bounds: import('maplibre-gl').LngLatBoundsLike = [-23.895, 34.9, 45.806, 71.352];

			map = new maplibre.Map({
				container,
				style: backgroundStyle,
				bounds
			});

			inspector = new Inspector(map);
			canvas = map.getCanvas();
			isLoading = false;
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Failed to load map';
			isLoading = false;
		}
	});

	// cleanup (runs automatically when dependencies change or component unmounts)
	onDestroy(() => {
		inspector?.detach();
		inspector = null;
		map?.remove();
		map = null;
	});

	// Legitimate side effect: updates MapLibre map style when overlay or background changes
	$effect(() => {
		// Track map, overlay, and backgroundStyle as dependencies
		const currentMap = map;
		const currentOverlay = overlay_source;
		const currentBackgroundStyle = backgroundStyle;

		if (!currentMap) return;
		if (!currentOverlay) {
			inspector?.detach();
			currentMap.setStyle(currentBackgroundStyle);
			return;
		}

		// Overlay present: update style & inspection handlers
		updateOverlay();
	});

	async function updateOverlay() {
		if (!map || !overlay_source) return;

		const source = overlay_source;
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

<div bind:this={container} class="map-container">
	{#if isLoading}
		<div class="map-loading">Loading map...</div>
	{/if}
	{#if loadError}
		<div class="map-error">Error: {loadError}</div>
	{/if}
</div>
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
	.map-loading,
	.map-error {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		padding: 1rem;
		background: rgba(255, 255, 255, 0.9);
		border-radius: 4px;
	}
	.map-error {
		color: red;
	}
</style>
