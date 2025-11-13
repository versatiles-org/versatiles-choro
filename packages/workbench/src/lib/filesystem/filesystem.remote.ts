import { query } from '$app/server';
import * as v from 'valibot';
import { readdirSync, statSync } from 'fs';
import { resolve } from 'path';
import { DATA_PATH } from './filesystem.server';


export const getDataPath = query(() => {
	return DATA_PATH;
});

export const getChildren = query(v.string(), async (path) => {
	path = resolve(DATA_PATH, path.replace(/^\/+/, ''));
	return readdirSync(path)
		.filter((name) => !name.startsWith('.'))
		.map((name) => {
			const childPath = resolve(path, name);
			const stats = statSync(childPath);
			return {
				name,
				isDirectory: stats.isDirectory(),
				size: stats.size
			};
		});
});
