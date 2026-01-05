import type { Map, MapLayerMouseEvent } from 'maplibre-gl';
import { writable, type Writable } from 'svelte/store';
import equal from 'fast-deep-equal';

interface PropertyEntry {
	name: string;
	value: string;
}

export class Inspector {
	map: Map;
	canvas: HTMLCanvasElement;
	layerIds: string[] = [];
	selectedProperties;
	mouseMoveHandler: ((e: MapLayerMouseEvent) => void) | null = null;
	mouseLeaveHandler: ((e: MapLayerMouseEvent) => void) | null = null;
	private rafId: number | null = null;

	constructor(map: Map) {
		this.map = map;
		this.canvas = map.getCanvas();
		this.selectedProperties = $state<PropertyEntry[][]>([]);
	}

	detach() {
		if (this.layerIds.length === 0) return;

		// Cancel any pending RAF
		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}

		if (this.mouseMoveHandler) {
			this.map.off('mousemove', this.layerIds, this.mouseMoveHandler);
			this.mouseMoveHandler = null;
		}
		if (this.mouseLeaveHandler) {
			this.map.off('mouseleave', this.layerIds, this.mouseLeaveHandler);
			this.mouseLeaveHandler = null;
		}

		this.canvas.style.cursor = '';
		this.layerIds = [];
		this.selectedProperties = [];
	}

	async attach(layerIds: string[]) {
		this.layerIds = layerIds;

		this.mouseMoveHandler = (e) => {
			// Cancel previous RAF if still pending
			if (this.rafId !== null) {
				cancelAnimationFrame(this.rafId);
			}

			// Schedule update for next animation frame (throttle to 60fps)
			this.rafId = requestAnimationFrame(() => {
				this.rafId = null;

				const properties = (e.features ?? []).map((feature) => {
					const props: PropertyEntry[] = [];
					for (const key in feature.properties) {
						props.push({ name: key, value: String(feature.properties[key]) });
					}
					props.sort((a, b) => a.name.localeCompare(b.name));
					return props;
				});

				// Avoid unnecessary state updates using fast deep equality check
				if (!equal(properties, this.selectedProperties)) {
					this.selectedProperties = properties;
				}

				this.canvas.style.cursor = 'pointer';
			});
		};

		this.mouseLeaveHandler = () => {
			// Cancel any pending RAF
			if (this.rafId !== null) {
				cancelAnimationFrame(this.rafId);
				this.rafId = null;
			}

			this.selectedProperties = [];
			this.canvas.style.cursor = '';
		};

		this.map.on('mousemove', this.layerIds, this.mouseMoveHandler);
		this.map.on('mouseleave', this.layerIds, this.mouseLeaveHandler);
	}
}
