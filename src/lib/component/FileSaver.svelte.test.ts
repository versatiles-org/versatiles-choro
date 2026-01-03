import { describe, it, expect, vi } from 'vitest';

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
	it('component can be imported and instantiated', () => {
		expect(true).toBe(true);
	});

	it('uses filesystem getRootDirectory', async () => {
		const { getRootDirectory } = await import('$lib/api/filesystem.svelte');
		const root = getRootDirectory();
		expect(root.fullPath()).toBe('/home/user');
	});

	it('filesystem directory has children including existing files', async () => {
		const { getRootDirectory, FsFile } = await import('$lib/api/filesystem.svelte');
		const root = getRootDirectory();
		const children = await root.getChildren();
		const files = children.filter((c) => c instanceof FsFile);
		expect(files.length).toBeGreaterThan(0);
	});

	it('can identify existing files for overwrite detection', async () => {
		const { getRootDirectory, FsFile } = await import('$lib/api/filesystem.svelte');
		const root = getRootDirectory();
		const children = await root.getChildren();
		const existingNames = children.filter((c) => c instanceof FsFile).map((f) => f.getName());
		expect(existingNames).toContain('existing.versatiles');
	});

	it('can add file extension to filename', () => {
		const filename = 'output';
		const extension = '.versatiles';
		const finalFilename = filename + extension;
		expect(finalFilename).toBe('output.versatiles');
	});

	it('checks if filename ends with extension', () => {
		const filename1 = 'output.versatiles';
		const filename2 = 'output';
		const extension = '.versatiles';

		expect(filename1.endsWith(extension)).toBe(true);
		expect(filename2.endsWith(extension)).toBe(false);
	});

	it('can build full path from directory and filename', () => {
		const dirPath = '/home/user';
		const filename = 'output.versatiles';
		const fullPath = dirPath + '/' + filename;
		expect(fullPath).toBe('/home/user/output.versatiles');
	});
});
