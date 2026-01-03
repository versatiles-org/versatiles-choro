<script lang="ts">
	import FileSelector from './FileSelector.svelte';
	import type { FsDirectory } from '$lib/api/filesystem.svelte';

	let {
		initialDirectory = undefined,
		showModal = $bindable(true),
		file = $bindable(undefined),
		fileFilter = undefined,
		title = 'Select File'
	}: {
		initialDirectory?: FsDirectory;
		showModal?: boolean;
		file?: string | undefined;
		fileFilter?: (name: string) => boolean;
		title?: string;
	} = $props();
</script>

<FileSelector {initialDirectory} bind:showModal bind:file {fileFilter} {title} />
