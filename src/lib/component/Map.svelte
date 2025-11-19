<script lang="ts">
	import maplibregl, { type LngLatBoundsLike, type Map } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { onMount, onDestroy } from 'svelte';
	import { createStyle, getTileSource, overlayStyles, type BackgroundMap } from './map';

	// --- Props  --------------------------------------------------------------
	let {
		backgroundMap,
		inspectOverlay = false,
		onclick,
		onerror,
		onload,
		onmove,
		overlayFile
	}: {
		backgroundMap?: BackgroundMap;
		inspectOverlay?: boolean;
		onclick?: (payload: { lngLat: maplibregl.LngLat; originalEvent: MouseEvent }) => void;
		onerror?: (error: Error) => void;
		onload?: (map: Map) => void;
		onmove?: (map: Map) => void;
		overlayFile?: string;
	} = $props();

	// --- State ---------------------------------------------------------------
	let container: HTMLDivElement | null = null;
	let map: Map | null = null;

	const backgroundStyle = createStyle(backgroundMap);

	// --- Lifecycle: onMount that auto-cleans ---------------------------------
	onMount(async () => {
		if (!container) return;
		let bounds: LngLatBoundsLike = [-23.895, 34.9, 45.806, 71.352];
		let style = backgroundStyle;

		if (overlayFile) {
			const source = await getTileSource(overlayFile);
			style = overlayStyles(style, source.getStyle());
			bounds = source.getBounds() ?? bounds;
		}

		map = new maplibregl.Map({
			container,
			style,
			bounds
		});

		map.on('load', () => onload?.(map!));
		map.on('click', (e) =>
			onclick?.({
				lngLat: e.lngLat,
				originalEvent: e.originalEvent as MouseEvent
			})
		);
		map.on('moveend', () => onmove?.(map!));

		map.on('error', (e) => {
			const err = (e as ErrorEvent)?.error ?? e;
			onerror?.(err instanceof Error ? err : new Error(String(err)));
		});
	});

	// cleanup (runs automatically when dependencies change or component unmounts)
	onDestroy(() => {
		map?.remove();
		map = null;
	});
</script>

<div bind:this={container} class="map-container"></div>

<style>
	.map-container {
		position: absolute;
		width: 100%;
		height: 100%;
		min-height: 300px;
	}
</style>
