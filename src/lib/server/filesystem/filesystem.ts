import { mkdirSync } from 'fs';
import * as path from 'path';

const CWD = process.cwd();
export const DATA_PATH = path.resolve(CWD, process.env.DATA_PATH || '.');
export const TEMP_PATH = path.resolve(CWD, process.env.TEMP_PATH || 'temp');
mkdirSync(DATA_PATH, { recursive: true });
mkdirSync(TEMP_PATH, { recursive: true });

export function resolve(pathSegment: string): string {
	return path.resolve(DATA_PATH, pathSegment.replace(/^\/+/, ''));
}
