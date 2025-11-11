import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const TileSource = z.object({
	id: z.string(),
	name: z.string().optional(),
	url: z.string().url().optional(),
	type: z.enum(['vector', 'raster']).optional(),
});

export const TileJSON = z.object({
	tiles: z.array(z.string().url()),
	minzoom: z.number().int().optional(),
	maxzoom: z.number().int().optional(),
	bounds: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
	center: z.tuple([z.number(), z.number(), z.number().optional()]).optional(),
	vector_layers: z.array(z.object({
		id: z.string(),
		fields: z.record(z.string()).optional(),
	})).optional(),
}).passthrough();

export const apiContract = c.router({
	listTiles: {
		method: 'GET',
		path: '/api/tiles',
		responses: { 200: z.array(TileSource) },
	},
	getTileJSON: {
		method: 'GET',
		path: '/api/tilejson',
		query: z.object({ src: z.string().min(1) }),
		responses: { 200: TileJSON },
	},
});

export type ApiContract = typeof apiContract;