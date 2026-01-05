import { getChildren } from './filesystem.remote';

export class FsDirectory {
	private name: string;
	private parent: FsDirectory | null;
	constructor(name: string, parent: FsDirectory | null = null) {
		this.name = name;
		this.parent = parent;
	}
	fullPath(): string {
		let path = '';
		if (this.parent) path += this.parent.fullPath();
		return cleanPath(path + '/' + this.name);
	}
	async getChildren(): Promise<(FsDirectory | FsFile)[]> {
		const children = await getChildren(this.fullPath());
		return children.map((child) => {
			if (child.isDirectory) {
				return new FsDirectory(child.name, this);
			} else {
				return new FsFile(child.name, this, child.size, child.mtime);
			}
		});
	}
	getParent(): FsDirectory | null {
		return this.parent;
	}
	getName(): string {
		return this.name;
	}
}

export class FsFile {
	private name: string;
	private directory: FsDirectory;
	private size: number;
	private mtime: number;
	constructor(name: string, directory: FsDirectory, size: number, mtime: number) {
		this.name = name;
		this.directory = directory;
		this.size = size;
		this.mtime = mtime;
	}
	getDirectory(): FsDirectory {
		return this.directory;
	}
	getSize(): number {
		return this.size;
	}
	getMtime(): number {
		return this.mtime;
	}
	fullPath(): string {
		return cleanPath(this.directory.fullPath() + '/' + this.name);
	}
	getName(): string {
		return this.name;
	}
}

export function getRootDirectory() {
	return new FsDirectory('', null);
}

function cleanPath(path: string): string {
	return path.replace(/\/+/g, '/').replace(/\/$/g, '');
}
