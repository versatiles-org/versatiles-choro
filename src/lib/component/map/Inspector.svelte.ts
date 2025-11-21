import maplibre from 'maplibre-gl';
import { writable, type Writable } from 'svelte/store';

interface PropertyEntry {
	name: string;
	value: string;
}

export class Inspector {
	map: maplibre.Map;
	canvas: HTMLCanvasElement;
	layerIds: string[] = [];
	selectedProperties;
	mouseMoveHandler: ((e: maplibre.MapLayerMouseEvent) => void) | null = null;
	mouseLeaveHandler: ((e: maplibre.MapLayerMouseEvent) => void) | null = null;

	constructor(map: maplibre.Map) {
		this.map = map;
		this.canvas = map.getCanvas();
		this.selectedProperties = $state<PropertyEntry[][]>([]);
	}

	detach() {
		if (this.layerIds.length === 0) return;

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
			const properties = (e.features ?? []).map((feature) => {
				const props: PropertyEntry[] = [];
				for (const key in feature.properties) {
					props.push({ name: key, value: String(feature.properties[key]) });
				}
				props.sort((a, b) => a.name.localeCompare(b.name));
				return props;
			});

			// Avoid unnecessary state updates
			if (JSON.stringify(properties) !== JSON.stringify(this.selectedProperties)) {
				this.selectedProperties = properties;
			}

			this.canvas.style.cursor = 'pointer';
		};

		this.mouseLeaveHandler = () => {
			this.selectedProperties = [];

			this.canvas.style.cursor = '';
		};

		this.map.on('mousemove', this.layerIds, this.mouseMoveHandler);
		this.map.on('mouseleave', this.layerIds, this.mouseLeaveHandler);
	}
}
