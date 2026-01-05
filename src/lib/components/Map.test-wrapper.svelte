<script lang="ts">
	import Map from './Map.svelte';
	import type { BackgroundMap } from './map/style-background';
	import type { TileSource } from './map/tile-source';

	let {
		backgroundMap = undefined,
		inspectOverlay = false,
		overlay_source = undefined
	}: {
		backgroundMap?: BackgroundMap;
		inspectOverlay?: boolean;
		overlay_source?: TileSource;
	} = $props();
</script>

<Map {backgroundMap} {inspectOverlay} {overlay_source} />
