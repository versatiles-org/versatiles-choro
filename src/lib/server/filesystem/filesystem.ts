import { mkdirSync } from 'fs';
import * as path from 'path';

const CWD = process.cwd();
const DATA_PATH = path.resolve(CWD, process.env.DATA_PATH || '.');
const TEMP_PATH = path.resolve(CWD, process.env.TEMP_PATH || 'temp');

mkdirSync(DATA_PATH, { recursive: true });
mkdirSync(TEMP_PATH, { recursive: true });

export function resolve_data(pathSegment: string): string {
	return path.resolve(DATA_PATH, pathSegment.replace(/^\/+/, ''));
}

export function resolve_temp(pathSegment: string): string {
	return path.resolve(TEMP_PATH, pathSegment.replace(/^\/+/, ''));
}
