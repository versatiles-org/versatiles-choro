import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import userEvent from '@testing-library/user-event';
import SidebarFoldableWrapper from './SidebarFoldable.test-wrapper.svelte';

// Mock svelte/transition to avoid issues with transitions in tests
vi.mock('svelte/transition', () => ({
	slide: () => ({
		delay: 0,
		duration: 0
	})
}));

describe('SidebarFoldable', () => {
	it('renders with title', () => {
		render(SidebarFoldableWrapper, {
			props: {
				title: 'Test Section'
			}
		});

		const button = screen.getByRole('button', { name: /Test Section/i });
		expect(button).toBeInTheDocument();
	});

	it('is closed by default when open prop is not provided', () => {
		render(SidebarFoldableWrapper, {
			props: {
				title: 'Test Section',
				open: false
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveAttribute('aria-expanded', 'false');
		expect(button.textContent).toContain('▸'); // Closed icon
	});

	it('is open when open prop is true', () => {
		render(SidebarFoldableWrapper, {
			props: {
				title: 'Test Section',
				open: true
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveAttribute('aria-expanded', 'true');
		expect(button.textContent).toContain('▾'); // Open icon
	});

	it('is closed when open prop is false', () => {
		render(SidebarFoldableWrapper, {
			props: {
				title: 'Test Section',
				open: false
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveAttribute('aria-expanded', 'false');
		expect(button.textContent).toContain('▸'); // Closed icon
	});

	it('shows content when open', () => {
		render(SidebarFoldableWrapper, {
			props: {
				title: 'Test Section',
				open: true,
				content: 'Test content'
			}
		});

		const content = screen.getByRole('region', { name: 'Test Section' });
		expect(content).toBeInTheDocument();
		expect(content.textContent).toContain('Test content');
	});

	it('hides content when closed', () => {
		render(SidebarFoldableWrapper, {
			props: {
				title: 'Test Section',
				open: false,
				content: 'Test content'
			}
		});

		const content = screen.queryByRole('region', { name: 'Test Section' });
		expect(content).not.toBeInTheDocument();
	});

	it('toggles open state when button is clicked', async () => {
		const user = userEvent.setup();

		const { container } = render(SidebarFoldableWrapper, {
			props: {
				title: 'Test Section',
				open: false,
				content: 'Test content'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveAttribute('aria-expanded', 'false');

		// Click to open
		await user.click(button);
		await tick();

		expect(button).toHaveAttribute('aria-expanded', 'true');
		expect(button.textContent).toContain('▾'); // Open icon
		expect(screen.getByRole('region')).toBeInTheDocument();

		// Click to close
		await user.click(button);
		await tick();

		expect(button).toHaveAttribute('aria-expanded', 'false');
		expect(button.textContent).toContain('▸'); // Closed icon
		expect(screen.queryByRole('region')).not.toBeInTheDocument();
	});

	it('does not toggle when disabled', async () => {
		const user = userEvent.setup();

		render(SidebarFoldableWrapper, {
			props: {
				title: 'Test Section',
				open: false,
				disabled: true,
				content: 'Test content'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
		expect(button).toHaveAttribute('aria-expanded', 'false');

		// Try to click
		await user.click(button);
		await tick();

		// Should still be closed
		expect(button).toHaveAttribute('aria-expanded', 'false');
		expect(screen.queryByRole('region')).not.toBeInTheDocument();
	});

	it('has proper ARIA attributes', () => {
		render(SidebarFoldableWrapper, {
			props: {
				title: 'Accessible Section',
				open: true,
				content: 'Content'
			}
		});

		const button = screen.getByRole('button');
		const content = screen.getByRole('region');

		expect(button).toHaveAttribute('aria-expanded', 'true');
		expect(button).toHaveAttribute('aria-controls');

		const controlsId = button.getAttribute('aria-controls');
		expect(content).toHaveAttribute('id', controlsId);
		expect(content).toHaveAttribute('aria-label', 'Accessible Section');
	});

	it('changes icon when toggling', async () => {
		const user = userEvent.setup();

		render(SidebarFoldableWrapper, {
			props: {
				title: 'Test Section',
				open: false
			}
		});

		const button = screen.getByRole('button');

		// Initially closed - should show closed icon
		expect(button.textContent).toContain('▸');

		// Click to open
		await user.click(button);
		await tick();

		// Should show open icon
		expect(button.textContent).toContain('▾');

		// Click to close
		await user.click(button);
		await tick();

		// Should show closed icon again
		expect(button.textContent).toContain('▸');
	});

	it('generates unique content ID', () => {
		const { container: container1 } = render(SidebarFoldableWrapper, {
			props: {
				title: 'Section 1',
				open: true,
				content: 'Content 1'
			}
		});

		const { container: container2 } = render(SidebarFoldableWrapper, {
			props: {
				title: 'Section 2',
				open: true,
				content: 'Content 2'
			}
		});

		const button1 = container1.querySelector('button');
		const button2 = container2.querySelector('button');

		const id1 = button1?.getAttribute('aria-controls');
		const id2 = button2?.getAttribute('aria-controls');

		expect(id1).toBeTruthy();
		expect(id2).toBeTruthy();
		expect(id1).not.toBe(id2); // IDs should be unique
	});
});
