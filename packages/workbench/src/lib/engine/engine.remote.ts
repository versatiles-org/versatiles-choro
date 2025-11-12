import { query } from '$app/server';
import { getDataPath } from '$lib/filesystem/filesystem.remote';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import * as v from 'valibot';

export const getNewTileSourceId = query(v.string(), async (path: string) => {
	const DATA_PATH = await getDataPath();
	const fullPath = resolve(DATA_PATH, path.replace(/^\/+/, ''));
	const id = randomUUID().slice(-12);
	console.log(`Registering tile source ID ${id} for path ${fullPath}`);
	//engine.serveTileSourceFromPath( fullPath, id );
	return id;
});
