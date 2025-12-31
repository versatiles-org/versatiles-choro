import { mkdirSync } from 'fs';
import * as path from 'path';

const CWD = process.cwd();
const DATA_PATH = path.resolve(CWD, process.env.DATA_PATH || '.');
const TEMP_PATH = path.resolve(CWD, process.env.TEMP_PATH || 'temp');

mkdirSync(DATA_PATH, { recursive: true });
mkdirSync(TEMP_PATH, { recursive: true });

function resolvePath(basePath: string, ...pathSegment: string[]): string {
	const resolved = path.resolve(basePath, ...pathSegment.map((p) => p.replace(/^\/+/, '')));

	// Validate that the resolved path is within the base path (prevent directory traversal)
	const relative = path.relative(basePath, resolved);
	if (relative.startsWith('..') || path.isAbsolute(relative)) {
		throw new Error(`Invalid path: attempted directory traversal (${relative})`);
	}

	return resolved;
}

export function resolve_data(...pathSegment: string[]): string {
	return resolvePath(DATA_PATH, ...pathSegment);
}

export function resolve_temp(...pathSegment: string[]): string {
	return resolvePath(TEMP_PATH, ...pathSegment);
}
