/**
 * Global test setup file
 * This file runs before all tests and sets up common mocks for SvelteKit modules
 */

import { vi } from 'vitest';

// Ensure we're in a browser-like environment for Svelte 5
if (typeof globalThis !== 'undefined') {
	// @ts-ignore
	globalThis.browser = true;
}

// Mock SvelteKit environment modules
vi.mock('$app/environment', () => ({
	browser: true,
	building: false,
	dev: true,
	version: 'test'
}));

// Mock SvelteKit navigation module
vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadData: vi.fn(),
	preloadCode: vi.fn(),
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn(),
	pushState: vi.fn(),
	replaceState: vi.fn()
}));

// Mock SvelteKit stores
vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn()
	},
	navigating: {
		subscribe: vi.fn()
	},
	updated: {
		subscribe: vi.fn(),
		check: vi.fn()
	}
}));
