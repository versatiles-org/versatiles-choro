<script lang="ts">
	import maplibre, { type LngLat, type Map, type LngLatBoundsLike } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { onMount, onDestroy } from 'svelte';
	import { createStyle, getTileSource, overlayStyles, type BackgroundMap } from './map/map';
	import type { InferOutput } from 'valibot';
	import type { TilesInitRequest } from '$lib/api/types';

	// --- Props  --------------------------------------------------------------
	let {
		backgroundMap,
		inspectOverlay = false,
		onclick,
		onerror,
		onload,
		onmove,
		overlay
	}: {
		backgroundMap?: BackgroundMap;
		inspectOverlay?: boolean;
		onclick?: (payload: { lngLat: LngLat; originalEvent: MouseEvent }) => void;
		onerror?: (error: Error) => void;
		onload?: (map: Map) => void;
		onmove?: (map: Map) => void;
		overlay?: InferOutput<typeof TilesInitRequest>;
	} = $props();

	// --- State ---------------------------------------------------------------
	let container: HTMLDivElement | null = null;
	let canvas: HTMLCanvasElement | null = null;
	let map: Map | null = null;
	interface PropertyEntry {
		name: string;
		value: string;
	}
	let selectedProperties: PropertyEntry[][] = $state([]);

	const backgroundStyle = createStyle(backgroundMap);

	// --- Lifecycle: onMount that auto-cleans ---------------------------------
	onMount(async () => {
		if (!container) return;
		let bounds: LngLatBoundsLike = [-23.895, 34.9, 45.806, 71.352];
		let style = backgroundStyle;
		let overlayLayerIds: string[] = [];

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
	});

	// cleanup (runs automatically when dependencies change or component unmounts)
	onDestroy(() => {
		map?.remove();
		map = null;
	});

	$effect(() => {
		if (!map) return;
		let style = backgroundStyle;
		let overlayLayerIds: string[] = [];

		if (overlay) {
			getTileSource(overlay).then((source) => {
				const overlayStyle = source.getStyle();
				overlayLayerIds = overlayStyle.layers?.map((layer) => layer.id) ?? [];
				style = overlayStyles(backgroundStyle, overlayStyle);
				map!.setStyle(style);

				if (inspectOverlay && overlayLayerIds.length > 0) {
					map!.on('mousemove', overlayLayerIds, (e) => {
						const properties = (e.features ?? []).map((feature) => {
							const props: PropertyEntry[] = [];
							for (const key in feature.properties) {
								props.push({ name: key, value: String(feature.properties[key]) });
							}
							props.sort((a, b) => a.name.localeCompare(b.name));
							return props;
						});
						if (JSON.stringify(properties) !== JSON.stringify(selectedProperties)) {
							selectedProperties = properties;
						}
						canvas!.style.cursor = 'pointer';
					});
					map!.on('mouseleave', overlayLayerIds, () => {
						selectedProperties = [];
						canvas!.style.cursor = '';
					});
				}
			});
		} else {
			map.setStyle(style);
		}
	});
</script>

<div bind:this={container} class="map-container"></div>
{#if inspectOverlay}
	<div id="info">
		{#each selectedProperties as properties, index (index)}
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
