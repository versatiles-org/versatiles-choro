<script lang="ts">
	import maplibregl, { type Map } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import {  createStyle, getOverlayStyle, overlayStyles, type BackgroundMap } from './map';

	// --- Props  --------------------------------------------------------------
	let {
		backgroundMap,
		overlayFile,
		onload,
		onclick,
		onmove,
		onerror
	}: {
		backgroundMap?: BackgroundMap;
		overlayFile?: string;
		onload?: (map: Map) => void;
		onclick?: (payload: { lngLat: maplibregl.LngLat; originalEvent: MouseEvent }) => void;
		onmove?: (map: Map) => void;
		onerror?: (error: Error) => void;
	} = $props();

	// --- State ---------------------------------------------------------------
	let container: HTMLDivElement | null = null;
	let map: Map | null = null;

	// --- Lifecycle: onMount that auto-cleans ---------------------------------
	$effect(() => {
		(async () => {
			if (!container) return;

			const style = createStyle(backgroundMap);

			if (overlayFile) {
				const overlayStyle = await getOverlayStyle(overlayFile);
				console.log(overlayStyle);
				overlayStyles(style, overlayStyle);
			}

			map = new maplibregl.Map({
				container,
				style,
				bounds: [-23.895, 34.9, 45.806, 71.352]
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
		})();

		// cleanup (runs automatically when dependencies change or component unmounts)
		return () => {
			map?.remove();
			map = null;
		};
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
