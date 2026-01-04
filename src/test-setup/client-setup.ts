/**
 * Client-specific test setup
 * Sets up MSW for API mocking and browser API mocks
 */

import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';
import '@testing-library/jest-dom/vitest';

// Setup MSW server for API mocking
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
	server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers after each test
afterEach(() => {
	server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
	server.close();
});

// Mock browser APIs that are not available in jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock localStorage if needed
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
	length: 0,
	key: vi.fn()
};
global.localStorage = localStorageMock as Storage;

// Mock HTMLCanvasElement.getContext to prevent JSDOM warnings
HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
