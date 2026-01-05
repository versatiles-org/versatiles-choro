import { query } from '$app/server';
import * as v from 'valibot';
import { readdirSync, statSync } from 'fs';
import { resolve_data } from '../server/filesystem/filesystem';

export const getChildren = query(v.string(), async (path) => {
	path = path.replace(/^\/+/, '');
	const path_absolute = resolve_data(path);
	return readdirSync(path_absolute)
		.filter((name) => !name.startsWith('.'))
		.map((name) => {
			const childPath = resolve_data(path, name);
			const stats = statSync(childPath);
			return {
				name,
				isDirectory: stats.isDirectory(),
				size: stats.size,
				mtime: stats.mtime.getTime()
			};
		});
});
