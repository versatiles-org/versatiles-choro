import * as path from 'path';

export const DATA_PATH = path.resolve(process.cwd(), process.env.DATA_PATH || '.');

export function resolve(pathSegment: string): string {
	return path.resolve(DATA_PATH, pathSegment.replace(/^\/+/, ''));
}
