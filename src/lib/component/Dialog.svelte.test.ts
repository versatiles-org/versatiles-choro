import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import DialogWrapper from './Dialog.test-wrapper.svelte';

// Mock HTMLDialogElement methods
beforeEach(() => {
	HTMLDialogElement.prototype.showModal = vi.fn();
	HTMLDialogElement.prototype.close = vi.fn();
});

describe('Dialog', () => {
	it('renders children content', () => {
		const state = { showModal: false };

		const { container } = render(DialogWrapper, {
			props: {
				content: 'Test content',
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				}
			}
		});

		const dialog = container.querySelector('dialog');
		expect(dialog).toBeInTheDocument();
		expect(dialog?.textContent).toContain('Test content');
	});

	it('renders title when provided', () => {
		const state = { showModal: true };

		const { container } = render(DialogWrapper, {
			props: {
				title: 'Test Dialog',
				content: 'Content',
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				}
			}
		});

		// When dialog is open, content should be accessible
		const heading = container.querySelector('h2');
		expect(heading).toBeInTheDocument();
		expect(heading).toHaveTextContent('Test Dialog');
	});

	it('does not render title when not provided', () => {
		const state = { showModal: false };

		const { container } = render(DialogWrapper, {
			props: {
				content: 'Content',
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				}
			}
		});

		const heading = container.querySelector('h2');
		expect(heading).not.toBeInTheDocument();
	});

	it('calls showModal when showModal prop is true', async () => {
		const state = $state({ showModal: false });

		const { component } = render(DialogWrapper, {
			props: {
				content: 'Content',
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				}
			}
		});

		// Change showModal to true
		state.showModal = true;
		await tick();

		const showModalSpy = HTMLDialogElement.prototype.showModal as ReturnType<typeof vi.fn>;
		expect(showModalSpy).toHaveBeenCalled();
	});

	it('calls close when showModal prop is false', async () => {
		const state = $state({ showModal: true });

		const { component } = render(DialogWrapper, {
			props: {
				content: 'Content',
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				}
			}
		});

		// Change showModal to false
		state.showModal = false;
		await tick();

		const closeSpy = HTMLDialogElement.prototype.close as ReturnType<typeof vi.fn>;
		expect(closeSpy).toHaveBeenCalled();
	});

	it('sets showModal to false when dialog close event fires', async () => {
		const state = $state({ showModal: true });

		const { container } = render(DialogWrapper, {
			props: {
				content: 'Content',
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				}
			}
		});

		const dialog = container.querySelector('dialog');
		expect(state.showModal).toBe(true);

		// Simulate close event
		dialog?.dispatchEvent(new Event('close'));
		await tick();

		expect(state.showModal).toBe(false);
	});

	it('closes when backdrop is clicked', async () => {
		const state = { showModal: true };

		const { container } = render(DialogWrapper, {
			props: {
				content: 'Content',
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				}
			}
		});

		const dialog = container.querySelector('dialog');
		expect(dialog).toBeInTheDocument();

		// Simulate backdrop click (event.target === dialog)
		const clickEvent = new MouseEvent('click', { bubbles: true });
		Object.defineProperty(clickEvent, 'target', { value: dialog, enumerable: true });
		dialog?.dispatchEvent(clickEvent);
		await tick();

		const closeSpy = HTMLDialogElement.prototype.close as ReturnType<typeof vi.fn>;
		expect(closeSpy).toHaveBeenCalled();
	});

	it('does not close when content inside dialog is clicked', async () => {
		const state = { showModal: true };

		const { container } = render(DialogWrapper, {
			props: {
				content: 'Content',
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				}
			}
		});

		const dialog = container.querySelector('dialog');
		const closeSpy = HTMLDialogElement.prototype.close as ReturnType<typeof vi.fn>;
		closeSpy.mockClear();

		// Simulate click on content inside dialog (event.target !== dialog)
		const contentNode = dialog?.firstChild;
		const clickEvent = new MouseEvent('click', { bubbles: true });
		Object.defineProperty(clickEvent, 'target', { value: contentNode, enumerable: true });
		dialog?.dispatchEvent(clickEvent);
		await tick();

		expect(closeSpy).not.toHaveBeenCalled();
	});

	it('has proper ARIA attributes when title is provided', () => {
		const state = $state({ showModal: true });

		const { container } = render(DialogWrapper, {
			props: {
				title: 'Test Dialog',
				content: 'Content',
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				}
			}
		});

		const dialog = container.querySelector('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
		expect(dialog).toHaveAttribute('aria-labelledby');
		expect(dialog).toHaveAttribute('aria-describedby');

		const titleId = dialog?.getAttribute('aria-labelledby');
		const descId = dialog?.getAttribute('aria-describedby');

		expect(container.querySelector(`#${titleId}`)).toHaveTextContent('Test Dialog');
		expect(container.querySelector(`#${descId}`)).toBeInTheDocument();
	});

	it('has proper ARIA attributes when no title is provided', () => {
		const state = $state({ showModal: true });

		const { container } = render(DialogWrapper, {
			props: {
				content: 'Content',
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				}
			}
		});

		const dialog = container.querySelector('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
		expect(dialog).not.toHaveAttribute('aria-labelledby');
		expect(dialog).toHaveAttribute('aria-describedby');
	});

	it('closes when Escape key is pressed', async () => {
		const state = $state({ showModal: true });

		const { container } = render(DialogWrapper, {
			props: {
				content: 'Content',
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				}
			}
		});

		const dialog = container.querySelector('dialog');
		expect(state.showModal).toBe(true);

		// Simulate Escape key press
		const escapeEvent = new KeyboardEvent('keydown', {
			key: 'Escape',
			bubbles: true,
			cancelable: true
		});
		dialog?.dispatchEvent(escapeEvent);
		await tick();

		expect(state.showModal).toBe(false);
	});
});
