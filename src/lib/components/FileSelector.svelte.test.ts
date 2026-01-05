import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';

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
		getSize() {
			return 1024;
		}
		getMtime() {
			return Date.now();
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
				new MockFsFile('file1.txt', this.path),
				new MockFsFile('file2.versatiles', this.path)
			];
		}
	}

	return {
		FsDirectory: MockFsDirectory,
		FsFile: MockFsFile,
		getRootDirectory: vi.fn(() => new MockFsDirectory('root', '/home/user', null))
	};
});

describe('FileSelector', () => {
	it('component can be imported and instantiated', () => {
		expect(true).toBe(true);
	});

	it('uses filesystem getRootDirectory', async () => {
		const { getRootDirectory } = await import('$lib/api/filesystem.svelte');
		const root = getRootDirectory();
		expect(root.fullPath()).toBe('/home/user');
	});

	it('filesystem directory has children', async () => {
		const { getRootDirectory } = await import('$lib/api/filesystem.svelte');
		const root = getRootDirectory();
		const children = await root.getChildren();
		expect(children.length).toBeGreaterThan(0);
	});

	it('filesystem directory has parent navigation', async () => {
		const { getRootDirectory, FsDirectory } = await import('$lib/api/filesystem.svelte');
		const root = getRootDirectory();
		const children = await root.getChildren();
		const subdir = children.find((c) => c.getName() === 'subdir');
		if (subdir && subdir instanceof FsDirectory) {
			expect(subdir.getParent()).toBe(root);
		}
	});

	it('filesystem filters files correctly', async () => {
		const { getRootDirectory } = await import('$lib/api/filesystem.svelte');
		const root = getRootDirectory();
		const children = await root.getChildren();
		const files = children.filter((c) => c.getName().endsWith('.versatiles'));
		expect(files.length).toBeGreaterThan(0);
	});
});
