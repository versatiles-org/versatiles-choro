<script lang="ts">
	import maplibre, { type LngLat, type Map, type LngLatBoundsLike } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { onMount, onDestroy } from 'svelte';
	import { createStyle, getTileSource, overlayStyles, type BackgroundMap } from './map/map';

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
		onclick?: (payload: { lngLat: LngLat; originalEvent: MouseEvent }) => void;
		onerror?: (error: Error) => void;
		onload?: (map: Map) => void;
		onmove?: (map: Map) => void;
		overlayFile?: string;
	} = $props();

	// --- State ---------------------------------------------------------------
	let container: HTMLDivElement | null = null;
	let canvas: HTMLCanvasElement | null = null;
	let map: Map | null = null;

	const backgroundStyle = createStyle(backgroundMap);

	// --- Lifecycle: onMount that auto-cleans ---------------------------------
	onMount(async () => {
		if (!container) return;
		let bounds: LngLatBoundsLike = [-23.895, 34.9, 45.806, 71.352];
		let style = backgroundStyle;
		let overlayLayerIds: string[] = [];

		if (overlayFile) {
			const source = await getTileSource(overlayFile);
			const overlayStyle = source.getStyle();
			overlayLayerIds = overlayStyle.layers?.map((layer) => layer.id) ?? [];
			style = overlayStyles(style, overlayStyle);
			bounds = source.getBounds() ?? bounds;
		}

		map = new maplibre.Map({
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

		canvas = map.getCanvas();

		if (inspectOverlay && overlayLayerIds.length > 0) {
			let info = document.getElementById('info');
			map.on('mousemove', overlayLayerIds, (e) => {
				const properties = (e.features ?? []).map((f) => f.properties);
				if (properties.length > 0) {
					setInfo(`<pre>${JSON.stringify(properties, null, 2)}</pre>`);
				} else {
					setInfo();
				}
			});
			map.on('mouseleave', overlayLayerIds, () => {
				setInfo();
			});
			function setInfo(text?: string) {
				if (!info) return;
				if (text) {
					info.innerHTML = text;
					canvas!.style.cursor = 'pointer';
				} else {
					info.innerHTML = '';
					canvas!.style.cursor = '';
				}
			}
		}
	});

	// cleanup (runs automatically when dependencies change or component unmounts)
	onDestroy(() => {
		map?.remove();
		map = null;
	});
</script>

<div bind:this={container} class="map-container"></div>
{#if inspectOverlay}
	<div id="info"></div>
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
</style>
