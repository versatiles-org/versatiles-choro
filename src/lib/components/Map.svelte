<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createBackgroundStyle, type BackgroundMap } from './map/style-background';
	import { TileSource } from './map/tile-source';
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
		// Track dependencies
		const currentMap = map;
		const currentOverlay = overlay_source;
		const currentBackgroundStyle = backgroundStyle;
		const currentInspectOverlay = inspectOverlay;
		const currentInspector = inspector;

		if (!currentMap) return;
		if (!currentOverlay) {
			currentInspector?.detach();
			currentMap.setStyle(currentBackgroundStyle);
			return;
		}

		// Overlay present: update style & inspection handlers
		const overlayStyle = currentOverlay.getStyle();
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

<div bind:this={container} class="map-container">
	{#if isLoading}
		<div class="map-loading">Loading map...</div>
	{/if}
	{#if loadError}
		<div class="map-error">Error: {loadError}</div>
	{/if}
</div>
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
		max-width: 350px;
		max-height: 300px;
		overflow: auto;
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
	}
	.inspector-panel .prop-name {
		font-weight: 500;
		color: var(--color-text-secondary);
		white-space: nowrap;
		padding-right: 0.75rem;
	}
	.inspector-panel .prop-value {
		color: var(--color-text-primary);
		word-break: break-word;
	}
	.map-loading,
	.map-error {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		padding: 1rem;
		background: var(--color-overlay-lighter);
		border-radius: var(--radius-sm);
	}
	.map-error {
		color: var(--color-danger-500);
	}
</style>
