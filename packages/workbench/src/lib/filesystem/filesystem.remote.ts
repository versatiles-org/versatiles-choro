import { query } from '$app/server';
import * as v from 'valibot';
import { readdirSync, statSync } from 'fs';
import { resolve } from 'path';

const DATA_PATH = process.env.DATA_PATH || process.cwd();

export const getChildren = query(v.string(), async (path) => {
	path = resolve(DATA_PATH, path.replace(/^\/+/, ''));
	return readdirSync(path).filter(name => !name.startsWith('.')).map((name) => {
		const childPath = resolve(path, name);
		const stats = statSync(childPath);
		return {
			name,
			isDirectory: stats.isDirectory(),
			size: stats.size,
		}
	});
});
