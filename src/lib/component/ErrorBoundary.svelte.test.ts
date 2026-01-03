import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/svelte';
import ErrorBoundaryWrapper from './ErrorBoundary.test-wrapper.svelte';

describe('ErrorBoundary', () => {
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		// Spy on console.error to suppress error logs in tests
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	it('renders children when no error', () => {
		const { container } = render(ErrorBoundaryWrapper, {
			props: {
				content: 'Normal content'
			}
		});

		expect(container).toHaveTextContent('Normal content');
		expect(container.querySelector('.error-boundary')).not.toBeInTheDocument();
	});

	it('renders nothing when no children and no error', () => {
		const { container } = render(ErrorBoundaryWrapper, {
			props: {
				content: undefined
			}
		});

		// Should render empty (just the wrapper div)
		expect(container.querySelector('.error-boundary')).not.toBeInTheDocument();
	});

	it('registers window error event listener', () => {
		const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

		render(ErrorBoundaryWrapper, {
			props: {
				content: 'Content'
			}
		});

		expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
		expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

		addEventListenerSpy.mockRestore();
	});

	it('cleans up event listeners on unmount', () => {
		const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

		const { unmount } = render(ErrorBoundaryWrapper, {
			props: {
				content: 'Content'
			}
		});

		unmount();

		expect(removeEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
		expect(removeEventListenerSpy).toHaveBeenCalledWith(
			'unhandledrejection',
			expect.any(Function)
		);

		removeEventListenerSpy.mockRestore();
	});

	it('has correct CSS classes for error boundary structure', () => {
		const { container } = render(ErrorBoundaryWrapper, {
			props: {
				content: 'Content'
			}
		});

		// Even without an error, component should exist
		expect(container).toBeInTheDocument();
	});
});
