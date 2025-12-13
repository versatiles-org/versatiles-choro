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
		let showModal = $state(false);

		const { container } = render(DialogWrapper, {
			props: {
				content: 'Test content',
				get showModal() {
					return showModal;
				},
				set showModal(value) {
					showModal = value;
				}
			}
		});

		const dialog = container.querySelector('dialog');
		expect(dialog).toBeInTheDocument();
		expect(dialog?.textContent).toContain('Test content');
	});

	it('renders title when provided', () => {
		let showModal = $state(true);

		const { container } = render(DialogWrapper, {
			props: {
				title: 'Test Dialog',
				content: 'Content',
				get showModal() {
					return showModal;
				},
				set showModal(value) {
					showModal = value;
				}
			}
		});

		// When dialog is open, content should be accessible
		const heading = container.querySelector('h2');
		expect(heading).toBeInTheDocument();
		expect(heading).toHaveTextContent('Test Dialog');
	});

	it('does not render title when not provided', () => {
		let showModal = $state(false);

		const { container } = render(DialogWrapper, {
			props: {
				content: 'Content',
				get showModal() {
					return showModal;
				},
				set showModal(value) {
					showModal = value;
				}
			}
		});

		const heading = container.querySelector('h2');
		expect(heading).not.toBeInTheDocument();
	});

	it('calls showModal when showModal prop is true', async () => {
		let showModal = $state(false);

		const { component } = render(DialogWrapper, {
			props: {
				content: 'Content',
				get showModal() {
					return showModal;
				},
				set showModal(value) {
					showModal = value;
				}
			}
		});

		// Change showModal to true
		showModal = true;
		await tick();

		const showModalSpy = HTMLDialogElement.prototype.showModal as ReturnType<typeof vi.fn>;
		expect(showModalSpy).toHaveBeenCalled();
	});

	it('calls close when showModal prop is false', async () => {
		let showModal = $state(true);

		const { component } = render(DialogWrapper, {
			props: {
				content: 'Content',
				get showModal() {
					return showModal;
				},
				set showModal(value) {
					showModal = value;
				}
			}
		});

		// Change showModal to false
		showModal = false;
		await tick();

		const closeSpy = HTMLDialogElement.prototype.close as ReturnType<typeof vi.fn>;
		expect(closeSpy).toHaveBeenCalled();
	});

	it('sets showModal to false when dialog close event fires', async () => {
		let showModal = $state(true);

		const { container } = render(DialogWrapper, {
			props: {
				content: 'Content',
				get showModal() {
					return showModal;
				},
				set showModal(value) {
					showModal = value;
				}
			}
		});

		const dialog = container.querySelector('dialog');
		expect(showModal).toBe(true);

		// Simulate close event
		dialog?.dispatchEvent(new Event('close'));
		await tick();

		expect(showModal).toBe(false);
	});

	it('closes when backdrop is clicked', async () => {
		let showModal = $state(true);

		const { container } = render(DialogWrapper, {
			props: {
				content: 'Content',
				get showModal() {
					return showModal;
				},
				set showModal(value) {
					showModal = value;
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
		let showModal = $state(true);

		const { container } = render(DialogWrapper, {
			props: {
				content: 'Content',
				get showModal() {
					return showModal;
				},
				set showModal(value) {
					showModal = value;
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
});
