import type FileSelector from '$lib/components/FileSelector.svelte';

export interface FileSelectorState {
	fileName: string;
	file: File | null;
	selector: FileSelector | null;
	get isValid(): boolean;
}

/**
 * Creates reactive state for file selection
 * Note: This must be called within a Svelte component where $state is available
 * @param accept - File type filter (e.g., '.geojson', '.versatiles')
 * @param validator - Optional validation function
 */
export function createFileSelectorState(
	accept: string,
	validator?: (file: File) => boolean
): {
	fileName: string;
	file: File | null;
	selector: FileSelector | null;
	isValid: boolean;
} {
	return {
		fileName: '',
		file: null,
		selector: null,
		get isValid() {
			return this.file !== null && (validator ? validator(this.file) : true);
		}
	};
}

/**
 * Handle file change event
 */
export function handleFileChange(state: {
	file: File | null;
	fileName: string;
}): (event: CustomEvent<File>) => void {
	return (event: CustomEvent<File>) => {
		const file = event.detail;
		state.file = file;
		state.fileName = file.name;
	};
}
