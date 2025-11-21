import type { Map } from 'maplibre-gl';

export async function waitForStyleLoaded(currentMap: Map): Promise<void> {
	if (currentMap.isStyleLoaded()) return;

	await new Promise<void>((resolve) => {
		const onStyleData = () => {
			if (!currentMap.isStyleLoaded()) return;
			currentMap.off('styledata', onStyleData);
			resolve();
		};

		currentMap.on('styledata', onStyleData);
	});
}
