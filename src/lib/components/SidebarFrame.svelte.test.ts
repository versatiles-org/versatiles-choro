import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import SidebarFrameWrapper from './SidebarFrame.test-wrapper.svelte';

// Mock Icon component
vi.mock('@lucide/svelte', () => ({
	Settings: vi.fn(() => ({
		$$: {},
		$on: vi.fn(),
		$set: vi.fn()
	}))
}));

describe('SidebarFrame', () => {
	it('renders title', () => {
		const { container } = render(SidebarFrameWrapper, {
			props: {
				title: 'Test Frame Title'
			}
		});

		const title = container.querySelector('h4');
		expect(title).toBeInTheDocument();
		expect(title?.textContent).toContain('Test Frame Title');
	});

	it('renders children content when provided', () => {
		const { container } = render(SidebarFrameWrapper, {
			props: {
				title: 'Title',
				content: 'Test content here'
			}
		});

		const content = container.querySelector('.content');
		expect(content).toBeInTheDocument();
		expect(content).toHaveTextContent('Test content here');
	});

	it('renders without children when not provided', () => {
		const { container } = render(SidebarFrameWrapper, {
			props: {
				title: 'Title',
				content: undefined
			}
		});

		const content = container.querySelector('.content');
		expect(content).toBeInTheDocument();
		// Content should be empty
		expect(content?.textContent?.trim()).toBe('');
	});

	it('has correct CSS classes', () => {
		const { container } = render(SidebarFrameWrapper, {
			props: {
				title: 'Title'
			}
		});

		expect(container.querySelector('.frame')).toBeInTheDocument();
		expect(container.querySelector('.content')).toBeInTheDocument();
	});

	it('handles empty title', () => {
		const { container } = render(SidebarFrameWrapper, {
			props: {
				title: ''
			}
		});

		const title = container.querySelector('h4');
		expect(title).toBeInTheDocument();
	});

	it('renders frame with title and content structure', () => {
		const { container } = render(SidebarFrameWrapper, {
			props: {
				title: 'Test',
				content: 'Content'
			}
		});

		const frame = container.querySelector('.frame');
		const h4 = frame?.querySelector('h4');
		const content = frame?.querySelector('.content');

		expect(frame).toBeInTheDocument();
		expect(h4).toBeInTheDocument();
		expect(content).toBeInTheDocument();
	});
});
