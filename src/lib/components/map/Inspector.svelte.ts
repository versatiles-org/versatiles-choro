import type { Map, MapLayerMouseEvent } from 'maplibre-gl';
import { interpolateTemplate } from '$lib/choro/tooltip';

interface PropertyEntry {
	name: string;
	value: string;
}

interface MousePosition {
	x: number;
	y: number;
}

export class Inspector {
	map: Map;
	canvas: HTMLCanvasElement;
	layerIds: string[] = [];
	selectedProperties;
	lastSelectedFeature: maplibregl.MapGeoJSONFeature | null = null;
	mousePosition;
	mouseMoveHandler: ((e: MapLayerMouseEvent) => void) | null = null;
	mouseLeaveHandler: ((e: MapLayerMouseEvent) => void) | null = null;
	private hideTimeout: ReturnType<typeof setTimeout> | null = null;
	tooltipTemplate: string | undefined;
	tooltipContent;

	constructor(map: Map) {
		this.map = map;
		this.canvas = map.getCanvas();
		this.selectedProperties = $state<PropertyEntry[]>([]);
		this.mousePosition = $state<MousePosition | null>(null);
		this.tooltipContent = $state<string | null>(null);
	}

	detach() {
		if (this.layerIds.length === 0) return;

		if (this.hideTimeout !== null) {
			clearTimeout(this.hideTimeout);
			this.hideTimeout = null;
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
		this.mousePosition = null;
		this.tooltipContent = null;
	}

	async attach(layerIds: string[]) {
		this.layerIds = layerIds;

		this.mouseMoveHandler = (e) => {
			this.setFeature(e.features?.[0], e.point);
		};

		this.mouseLeaveHandler = () => {
			this.setFeature();
		};

		this.map.on('mousemove', this.layerIds, this.mouseMoveHandler);
		this.map.on('mouseleave', this.layerIds, this.mouseLeaveHandler);
	}

	private setFeature(feature?: maplibregl.MapGeoJSONFeature, point?: maplibregl.Point) {
		if (!feature) {
			// Delay hiding the panel to reduce flickering
			if (this.lastSelectedFeature && this.hideTimeout === null) {
				this.hideTimeout = setTimeout(() => {
					this.hideTimeout = null;
					this.selectedProperties = [];
					this.mousePosition = null;
					this.tooltipContent = null;
					this.canvas.style.cursor = '';
					this.lastSelectedFeature = null;
				}, 100);
			}
		} else {
			// Cancel pending hide if hovering over a new feature
			if (this.hideTimeout !== null) {
				clearTimeout(this.hideTimeout);
				this.hideTimeout = null;
			}

			if (this.lastSelectedFeature !== feature) {
				const props: PropertyEntry[] = [];
				for (const [key, value] of Object.entries(feature.properties)) {
					props.push({ name: key, value: String(value) });
				}
				props.sort((a, b) => a.name.localeCompare(b.name));

				this.selectedProperties = props;
				this.canvas.style.cursor = 'pointer';
				this.lastSelectedFeature = feature;

				// Compute tooltip content if template is set
				if (this.tooltipTemplate) {
					this.tooltipContent = interpolateTemplate(this.tooltipTemplate, feature.properties);
				} else {
					this.tooltipContent = null;
				}
			}

			// Update mouse position for hover panel
			this.mousePosition = { x: point?.x ?? 0, y: point?.y ?? 0 };
		}
	}
}
