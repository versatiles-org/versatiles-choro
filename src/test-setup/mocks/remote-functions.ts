/**
 * Mocks for SvelteKit remote functions
 */

import { vi } from 'vitest';

// Mock filesystem remote functions
vi.mock('$lib/api/filesystem.remote', () => ({
	getChildren: vi.fn().mockResolvedValue([
		{
			name: 'test-directory',
			isDirectory: true,
			size: 0
		},
		{
			name: 'test-file.geojson',
			isDirectory: false,
			size: 1024
		},
		{
			name: 'test-file.vpl',
			isDirectory: false,
			size: 2048
		}
	])
}));

// Add more remote function mocks as needed
