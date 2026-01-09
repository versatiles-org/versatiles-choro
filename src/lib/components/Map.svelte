<script lang="ts">
	import { onDestroy } from 'svelte';
	import { createBackgroundStyle, type BackgroundMap } from './map/style-background';
	import { TileSource } from './map/tile-source';
	import { overlayStyles } from './map/style';
	import { Inspector } from './map/Inspector.svelte.ts';
	import type { ChoroplethParams } from './map/color-schemes';
	import * as maplibregl from 'maplibre-gl';
	import type { LngLatBoundsLike, Map as MaplibreMap } from 'maplibre-gl';

	// --- Props  --------------------------------------------------------------
	let {
		backgroundMap,
		inspectOverlay = false,
		overlay_source,
		choropleth,
		choroplethLayerName,
		tooltipTemplate
	}: {
		backgroundMap?: BackgroundMap;
		inspectOverlay?: boolean;
		overlay_source?: TileSource;
		choropleth?: ChoroplethParams;
		choroplethLayerName?: string;
		tooltipTemplate?: string;
	} = $props();

	// --- State ---------------------------------------------------------------
	let container: HTMLDivElement | null = $state(null);
	let map: MaplibreMap | null = $state(null);

	// Derived background style so changes to backgroundMap are reflected
	let backgroundStyle = $derived(createBackgroundStyle(backgroundMap));
	let inspector: Inspector | null = $state(null);

	// --- Lifecycle: Initialize map when container becomes available ----------
	$effect(() => {
		if (!container || map) return;

		const bounds: LngLatBoundsLike = [-23.895, 34.9, 45.806, 71.352];

		map = new maplibregl.Map({
			container,
			style: backgroundStyle,
			bounds
		});

		inspector = new Inspector(map);
	});

	// cleanup on unmount
	onDestroy(() => {
		inspector?.detach();
		inspector = null;
		map?.remove();
		map = null;
	});

	// Sync tooltipTemplate to inspector
	$effect(() => {
		if (inspector) {
			inspector.tooltipTemplate = tooltipTemplate;
		}
	});

	// Legitimate side effect: updates MapLibre map style when overlay or background changes
	$effect(() => {
		// Track dependencies
		const currentMap = map;
		const currentOverlay = overlay_source;
		const currentBackgroundStyle = backgroundStyle;
		const currentInspectOverlay = inspectOverlay;
		const currentInspector = inspector;
		const currentChoropleth = choropleth;
		const currentChoroplethLayerName = choroplethLayerName;

		if (!currentMap) return;
		if (!currentOverlay) {
			currentInspector?.detach();
			currentMap.setStyle(currentBackgroundStyle);
			return;
		}

		// Determine which overlay style to use
		let overlayStyle;
		if (currentChoropleth && currentChoroplethLayerName) {
			// Use choropleth style when configured
			overlayStyle = currentOverlay.getChoroplethStyle(
				currentChoroplethLayerName,
				currentChoropleth
			);
		} else {
			// Fall back to inspector style
			overlayStyle = currentOverlay.getStyle();
		}

		const overlayLayerIds = overlayStyle.layers?.map((layer) => layer.id) ?? [];
		const style = overlayStyles(currentBackgroundStyle, overlayStyle);

		// Remove previous inspection handlers and apply new style
		currentInspector?.detach();

		if (currentInspectOverlay && overlayLayerIds.length > 0) {
			currentInspector?.attach(overlayLayerIds);
		}

		currentMap.setStyle(style);
	});
</script>

<div bind:this={container} class="map-container"></div>
{#if inspectOverlay && inspector && inspector.selectedProperties.length > 0}
	<div class="inspector-panel">
		<table>
			<tbody>
				{#each inspector.selectedProperties as prop, propIndex (propIndex)}
					<tr>
						<td class="prop-name">{prop.name}</td>
						<td class="prop-value">{prop.value}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
{#if inspector?.tooltipContent && inspector?.mousePosition}
	<div
		class="tooltip"
		style="left: {inspector.mousePosition.x + 15}px; top: {inspector.mousePosition.y + 15}px"
	>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- User-defined tooltip template requires HTML rendering -->
		{@html inspector.tooltipContent}
	</div>
{/if}

<style>
	.map-container {
		position: absolute;
		width: 100%;
		height: 100%;
		min-height: 300px;
	}
	.inspector-panel {
		position: absolute;
		top: 10px;
		right: 10px;
		width: 300px;
		overflow: hidden;
		background: var(--color-bg-primary);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-lg);
		font-size: 11px;
		padding: 0.5rem;
		pointer-events: none;
		z-index: 1000;
	}
	.inspector-panel table {
		border-collapse: collapse;
		width: 100%;
	}
	.inspector-panel td {
		padding: 2px 4px;
		vertical-align: top;
		width: 50%;
	}
	.inspector-panel .prop-name {
		font-weight: 500;
		color: var(--color-text-secondary);
		padding-right: 0.75rem;
		text-overflow: ellipsis;
	}
	.inspector-panel .prop-value {
		color: var(--color-text-primary);
		word-break: break-word;
	}

	.tooltip {
		position: absolute;
		max-width: 300px;
		background: var(--color-bg-primary);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-lg);
		font-size: 12px;
		padding: 0.5rem 0.75rem;
		pointer-events: none;
		z-index: 1000;
	}
</style>
