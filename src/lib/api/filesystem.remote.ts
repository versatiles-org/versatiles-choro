import { query } from '$app/server';
import * as v from 'valibot';
import { readdirSync, statSync } from 'fs';
import { resolveDataPath } from '../server/filesystem/filesystem';

export const getChildren = query(v.string(), async (path) => {
	path = path.replace(/^\/+/, '');
	const path_absolute = resolveDataPath(path);
	return readdirSync(path_absolute)
		.filter((name) => !name.startsWith('.'))
		.map((name) => {
			const childPath = resolveDataPath(path, name);
			const stats = statSync(childPath);
			return {
				name,
				isDirectory: stats.isDirectory(),
				size: stats.size,
				mtime: stats.mtime.getTime()
			};
		});
});
