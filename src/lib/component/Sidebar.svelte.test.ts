import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import SidebarWrapper from './Sidebar.test-wrapper.svelte';

describe('Sidebar', () => {
	it('renders with sidebar class', () => {
		const { container } = render(SidebarWrapper);

		const sidebar = container.querySelector('.sidebar');
		expect(sidebar).toBeInTheDocument();
	});

	it('renders children content', () => {
		const { container } = render(SidebarWrapper, {
			props: {
				content: 'Test sidebar content'
			}
		});

		const sidebar = container.querySelector('.sidebar');
		expect(sidebar?.textContent).toContain('Test sidebar content');
	});

	it('applies correct CSS classes for styling', () => {
		const { container } = render(SidebarWrapper, {
			props: {
				content: 'Content'
			}
		});

		const sidebar = container.querySelector('.sidebar');
		expect(sidebar).toBeInTheDocument();

		// Verify the element exists and has the correct class
		const computedStyle = window.getComputedStyle(sidebar!);
		expect(sidebar?.classList.contains('sidebar')).toBe(true);
	});

	it('renders without children', () => {
		const { container } = render(SidebarWrapper);

		const sidebar = container.querySelector('.sidebar');
		expect(sidebar).toBeInTheDocument();
		expect(sidebar?.textContent?.trim()).toBe('');
	});

	it('renders multiple child elements', () => {
		const { container } = render(SidebarWrapper, {
			props: {
				content: '<div>Item 1</div><div>Item 2</div>'
			}
		});

		const sidebar = container.querySelector('.sidebar');
		expect(sidebar?.textContent).toContain('Item 1');
		expect(sidebar?.textContent).toContain('Item 2');
	});
});
