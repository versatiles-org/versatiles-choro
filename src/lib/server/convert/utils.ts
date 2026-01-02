import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { FileSystemError, ValidationError } from '../errors/errors.js';
import { loggers } from '../logger/index.js';

/**
 * Validates input file exists
 * @throws {FileSystemError} if file doesn't exist
 */
export function validateInputFile(path: string): void {
	if (!existsSync(path)) {
		throw new FileSystemError(`Input file not found: ${path}`);
	}
}

/**
 * Validates output file has the correct extension
 * @throws {ValidationError} if extension is incorrect
 */
export function validateOutputExtension(path: string, extension: string): void {
	if (!path.endsWith(extension)) {
		throw new ValidationError(`Output file must have a ${extension} extension`);
	}
}

/**
 * Safely deletes a file, ignoring errors
 */
export async function safeDelete(path: string): Promise<void> {
	await unlink(path).catch((error) => {
		loggers.conversion.warn({ path, error }, 'Failed to delete file');
	});
}

/**
 * Safely deletes multiple files, ignoring errors
 */
export async function safeDeleteAll(paths: string[]): Promise<void> {
	await Promise.all(paths.map(safeDelete));
}
