export const prerender = false;

export async function load() {
	// Preload MapLibre during route navigation
	if (typeof window !== 'undefined') {
		import('maplibre-gl');
	}
	return {};
}
