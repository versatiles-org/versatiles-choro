/**
 * Filesystem mock utilities for testing
 */

import { vi } from 'vitest';

export interface MockFileSystemEntry {
	name: string;
	isDirectory: boolean;
	size: number;
}

/**
 * Creates a mock filesystem structure for testing
 */
export function createMockFileSystem(entries: MockFileSystemEntry[]) {
	return entries;
}

/**
 * Mock file entries for common test scenarios
 */
export const mockTestFiles: MockFileSystemEntry[] = [
	{
		name: 'data',
		isDirectory: true,
		size: 0
	},
	{
		name: 'example.geojson',
		isDirectory: false,
		size: 4096
	},
	{
		name: 'example.vpl',
		isDirectory: false,
		size: 2048
	},
	{
		name: 'polygons.json',
		isDirectory: false,
		size: 8192
	}
];

/**
 * Mock directory entries for testing navigation
 */
export const mockTestDirectories: MockFileSystemEntry[] = [
	{
		name: 'folder1',
		isDirectory: true,
		size: 0
	},
	{
		name: 'folder2',
		isDirectory: true,
		size: 0
	},
	{
		name: 'nested',
		isDirectory: true,
		size: 0
	}
];

/**
 * Helper to filter files by extension (mimics FileSelector behavior)
 */
export function filterByExtension(
	entries: MockFileSystemEntry[],
	extensions: string[]
): MockFileSystemEntry[] {
	return entries.filter((entry) => {
		if (entry.isDirectory) return true;
		return extensions.some((ext) => entry.name.endsWith(ext));
	});
}
