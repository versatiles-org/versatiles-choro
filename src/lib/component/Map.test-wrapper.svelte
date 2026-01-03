<script lang="ts">
	import Map from './Map.svelte';
	import type { BackgroundMap } from './map/style_background';
	import type { InferOutput } from 'valibot';
	import type { TilesInitRequest } from '$lib/api/requests';

	let {
		backgroundMap = undefined,
		inspectOverlay = false,
		overlay = undefined
	}: {
		backgroundMap?: BackgroundMap;
		inspectOverlay?: boolean;
		overlay?: InferOutput<typeof TilesInitRequest>;
	} = $props();
</script>

<Map {backgroundMap} {inspectOverlay} {overlay} />
