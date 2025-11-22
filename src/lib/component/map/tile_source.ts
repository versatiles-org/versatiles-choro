import type { TileJSONSpecificationVector } from '@versatiles/style';
import type { StyleSpecification } from 'maplibre-gl';
import { getInspectorStyle } from './style';
import { TilesInitRequest, TilesInitResponse } from '$lib/api/requests';
import * as v from 'valibot';

class TileSource {
	prefix: string;
	tileJson: TileJSONSpecificationVector | null = null;
	constructor(prefix: string) {
		this.prefix = prefix;
	}
	async init(): Promise<void> {
		const tileJson = (await (
			await fetch(`${this.resolve('meta.json')}`)
		).json()) as TileJSONSpecificationVector;
		tileJson.tiles = [this.resolve('{z}/{x}/{y}')];
		this.tileJson = tileJson;
	}
	resolve(path: string): string {
		return `${this.prefix}${path}`;
	}
	getTileJson(): TileJSONSpecificationVector {
		if (!this.tileJson) {
			throw new Error('TileSource not initialized');
		}
		return this.tileJson!;
	}
	getStyle(): StyleSpecification {
		if (!this.tileJson) {
			throw new Error('TileSource not initialized');
		}
		const style = getInspectorStyle(this.tileJson);
		style.layers = style.layers?.filter((layer) => layer.type !== 'background');
		return style;
	}
	getBounds(): [number, number, number, number] | undefined {
		return this.tileJson?.bounds;
	}
}

export async function getTileSource(
	init: v.InferInput<typeof TilesInitRequest>
): Promise<TileSource> {
	const req = v.parse(TilesInitRequest, init);
	const res = await fetch('/api/tiles/init', { body: JSON.stringify(req), method: 'POST' });
	if (!res.ok) {
		throw new Error(`Failed to initialize tile server: ${await res.text()}`);
	}
	const data = v.parse(TilesInitResponse, await res.json());
	const origin = window.location.origin;
	const source = new TileSource(`${origin}/api/tiles/load?id=${data.id}&path=`);
	await source.init();
	return source;
}
