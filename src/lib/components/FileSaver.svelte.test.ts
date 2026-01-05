import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import FileSaverWrapper from './FileSaver.test-wrapper.svelte';

// Mock HTMLDialogElement methods
beforeEach(() => {
	HTMLDialogElement.prototype.showModal = vi.fn();
	HTMLDialogElement.prototype.close = vi.fn();
});

// Mock filesystem
vi.mock('$lib/api/filesystem.svelte', () => {
	class MockFsFile {
		constructor(
			private name: string,
			private path: string
		) {}
		getName() {
			return this.name;
		}
		fullPath() {
			return this.path + '/' + this.name;
		}
	}

	class MockFsDirectory {
		constructor(
			private name: string,
			private path: string,
			private parent: MockFsDirectory | null = null
		) {}
		getName() {
			return this.name;
		}
		fullPath() {
			return this.path;
		}
		getParent() {
			return this.parent;
		}
		async getChildren() {
			return [
				new MockFsDirectory('subdir', this.path + '/subdir', this),
				new MockFsFile('existing.txt', this.path),
				new MockFsFile('existing.versatiles', this.path)
			];
		}
	}

	return {
		FsDirectory: MockFsDirectory,
		FsFile: MockFsFile,
		getRootDirectory: vi.fn(() => new MockFsDirectory('root', '/home/user', null))
	};
});

describe('FileSaver', () => {
	it('renders the file saver dialog', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				},
				title: 'Save Test File'
			}
		});

		await tick();

		const heading = container.querySelector('h3');
		expect(heading).toBeInTheDocument();
		expect(heading).toHaveTextContent('Save Test File');
	});

	it('displays current directory path', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				}
			}
		});

		await tick();

		expect(container.textContent).toContain('/home/user');
	});

	it('shows filename input field', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				}
			}
		});

		await tick();

		const input = container.querySelector('input#filename');
		expect(input).toBeInTheDocument();
	});

	it('displays default filename when provided', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				},
				defaultFilename: 'output'
			}
		});

		await tick();

		const input = container.querySelector('input#filename') as HTMLInputElement;
		expect(input.value).toBe('output');
	});

	it('displays extension hint when provided', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				},
				defaultExtension: '.versatiles'
			}
		});

		await tick();

		const extension = container.querySelector('.extension');
		expect(extension).toBeInTheDocument();
		expect(extension).toHaveTextContent('.versatiles');
	});

	it('shows Save and Cancel buttons', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				}
			}
		});

		await tick();

		const buttons = container.querySelectorAll('.actions button');
		expect(buttons.length).toBe(2);
		expect(buttons[0]).toHaveTextContent('Cancel');
		expect(buttons[1]).toHaveTextContent('Save');
	});

	it('disables Save button when filename is empty', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				}
			}
		});

		await tick();

		const saveButton = Array.from(container.querySelectorAll('.actions button')).find(
			(btn) => btn.textContent === 'Save'
		) as HTMLButtonElement;

		expect(saveButton.disabled).toBe(true);
	});

	it('enables Save button when filename is entered', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				}
			}
		});

		await tick();

		const input = container.querySelector('input#filename') as HTMLInputElement;
		await fireEvent.input(input, { target: { value: 'myfile' } });
		await tick();

		const saveButton = Array.from(container.querySelectorAll('.actions button')).find(
			(btn) => btn.textContent === 'Save'
		) as HTMLButtonElement;

		expect(saveButton.disabled).toBe(false);
	});

	it('closes dialog when Cancel is clicked', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				}
			}
		});

		await tick();

		const cancelButton = Array.from(container.querySelectorAll('.actions button')).find(
			(btn) => btn.textContent === 'Cancel'
		) as HTMLButtonElement;

		await fireEvent.click(cancelButton);
		await tick();

		expect(state.showModal).toBe(false);
	});

	it('sets filepath and closes dialog when Save is clicked', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				},
				defaultFilename: 'output'
			}
		});

		await tick();

		const saveButton = Array.from(container.querySelectorAll('.actions button')).find(
			(btn) => btn.textContent === 'Save'
		) as HTMLButtonElement;

		await fireEvent.click(saveButton);
		await tick();

		expect(state.filepath).toBe('/home/user/output');
		expect(state.showModal).toBe(false);
	});

	it('adds extension to filename if not present', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				},
				defaultFilename: 'output',
				defaultExtension: '.versatiles'
			}
		});

		await tick();

		const saveButton = Array.from(container.querySelectorAll('.actions button')).find(
			(btn) => btn.textContent === 'Save'
		) as HTMLButtonElement;

		await fireEvent.click(saveButton);
		await tick();

		expect(state.filepath).toBe('/home/user/output.versatiles');
	});

	it('does not duplicate extension if already present', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				},
				defaultFilename: 'output.versatiles',
				defaultExtension: '.versatiles'
			}
		});

		await tick();

		const saveButton = Array.from(container.querySelectorAll('.actions button')).find(
			(btn) => btn.textContent === 'Save'
		) as HTMLButtonElement;

		await fireEvent.click(saveButton);
		await tick();

		expect(state.filepath).toBe('/home/user/output.versatiles');
	});

	it('shows overwrite warning when file exists', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				},
				defaultFilename: 'existing.versatiles',
				confirmOverwrite: true
			}
		});

		await tick();
		await tick(); // Wait for loadDirectory to complete

		const saveButton = Array.from(container.querySelectorAll('.actions button')).find(
			(btn) => btn.textContent === 'Save'
		) as HTMLButtonElement;

		await fireEvent.click(saveButton);
		await tick();

		// Dialog should still be open
		expect(state.showModal).toBe(true);

		// Overwrite warning should be visible
		const warning = container.querySelector('.overwrite-warning');
		expect(warning).toBeInTheDocument();
		expect(warning?.textContent).toContain('File already exists');
	});

	it('cancels overwrite warning', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				},
				defaultFilename: 'existing.versatiles',
				confirmOverwrite: true
			}
		});

		await tick();
		await tick(); // Wait for loadDirectory

		const saveButton = Array.from(container.querySelectorAll('.actions button')).find(
			(btn) => btn.textContent === 'Save'
		) as HTMLButtonElement;

		await fireEvent.click(saveButton);
		await tick();

		// Find and click the cancel button in the warning
		const warningCancelButton = Array.from(
			container.querySelectorAll('.warning-actions button')
		).find((btn) => btn.textContent === 'Cancel') as HTMLButtonElement;

		await fireEvent.click(warningCancelButton);
		await tick();

		// Warning should be hidden
		const warning = container.querySelector('.overwrite-warning');
		expect(warning).not.toBeInTheDocument();

		// Dialog should still be open
		expect(state.showModal).toBe(true);
	});

	it('confirms overwrite and saves file', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				},
				defaultFilename: 'existing.versatiles',
				confirmOverwrite: true
			}
		});

		await tick();
		await tick(); // Wait for loadDirectory

		const saveButton = Array.from(container.querySelectorAll('.actions button')).find(
			(btn) => btn.textContent === 'Save'
		) as HTMLButtonElement;

		await fireEvent.click(saveButton);
		await tick();

		// Find and click the overwrite button in the warning
		const overwriteButton = Array.from(container.querySelectorAll('.warning-actions button')).find(
			(btn) => btn.textContent === 'Overwrite'
		) as HTMLButtonElement;

		await fireEvent.click(overwriteButton);
		await tick();

		// File should be saved and dialog closed
		expect(state.filepath).toBe('/home/user/existing.versatiles');
		expect(state.showModal).toBe(false);
	});

	it('skips overwrite warning when confirmOverwrite is false', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				},
				defaultFilename: 'existing.versatiles',
				confirmOverwrite: false
			}
		});

		await tick();
		await tick(); // Wait for loadDirectory

		const saveButton = Array.from(container.querySelectorAll('.actions button')).find(
			(btn) => btn.textContent === 'Save'
		) as HTMLButtonElement;

		await fireEvent.click(saveButton);
		await tick();

		// Should save directly without warning
		expect(state.filepath).toBe('/home/user/existing.versatiles');
		expect(state.showModal).toBe(false);

		// No warning should be shown
		const warning = container.querySelector('.overwrite-warning');
		expect(warning).not.toBeInTheDocument();
	});

	it('trims whitespace from filename', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				},
				defaultFilename: '  output  '
			}
		});

		await tick();

		const saveButton = Array.from(container.querySelectorAll('.actions button')).find(
			(btn) => btn.textContent === 'Save'
		) as HTMLButtonElement;

		await fireEvent.click(saveButton);
		await tick();

		expect(state.filepath).toBe('/home/user/output');
	});

	it('shows subdirectories and files in directory list', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				}
			}
		});

		await tick();
		await tick(); // Wait for loadDirectory

		// Should show subdirectory
		expect(container.textContent).toContain('subdir/');

		// Should show existing files
		expect(container.textContent).toContain('existing.txt');
		expect(container.textContent).toContain('existing.versatiles');
	});

	it('handles Enter key to save', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				},
				defaultFilename: 'output'
			}
		});

		await tick();

		const input = container.querySelector('input#filename') as HTMLInputElement;

		// Simulate Enter key press
		await fireEvent.keyDown(input, { key: 'Enter' });
		await tick();

		expect(state.filepath).toBe('/home/user/output');
		expect(state.showModal).toBe(false);
	});

	it('does not save on Enter when filename is empty', async () => {
		const state = $state({ showModal: true, filepath: undefined });

		const { container } = render(FileSaverWrapper, {
			props: {
				get showModal() {
					return state.showModal;
				},
				set showModal(value) {
					state.showModal = value;
				},
				get filepath() {
					return state.filepath;
				},
				set filepath(value) {
					state.filepath = value;
				}
			}
		});

		await tick();

		const input = container.querySelector('input#filename') as HTMLInputElement;

		// Simulate Enter key press with empty filename
		await fireEvent.keyDown(input, { key: 'Enter' });
		await tick();

		expect(state.filepath).toBeUndefined();
		expect(state.showModal).toBe(true);
	});
});
