import {getChildren} from './filesystem.remote';


export class FsDirectory {
	private name: string;
	private parent: FsDirectory | null;
	constructor(name: string, parent: FsDirectory | null = null) {
		this.name = name;
		this.parent = parent;
	}
	fullPath(): string {
		if (this.parent) {
			return this.parent.fullPath() + '/' + this.name;
		} else {
			return '/' + this.name;
		}
	}
	async getChildren(): Promise<(FsDirectory | FsFile)[]> {
		const children = await getChildren(this.fullPath());
		return children.map((child) => {
			if (child.isDirectory) {
				return new FsDirectory(child.name, this);
			} else {
				return new FsFile(child.name, this, child.size);
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
	constructor(name: string, directory: FsDirectory, size: number) {
		this.name = name;
		this.directory = directory;
		this.size = size;
	}
	fullPath(): string {
		return this.directory.fullPath() + '/' + this.name;
	}
	getName(): string {
		return this.name;
	}
}

export function getRootDirectory() { return new FsDirectory('', null); }