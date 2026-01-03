<script lang="ts">
	import FileSaver from './FileSaver.svelte';
	import type { FsDirectory } from '$lib/api/filesystem.svelte';

	let {
		initialDirectory = undefined,
		showModal = $bindable(true),
		filepath = $bindable(undefined),
		defaultFilename = '',
		defaultExtension = '',
		confirmOverwrite = true,
		title = 'Save File'
	}: {
		initialDirectory?: FsDirectory;
		showModal?: boolean;
		filepath?: string | undefined;
		defaultFilename?: string;
		defaultExtension?: string;
		confirmOverwrite?: boolean;
		title?: string;
	} = $props();
</script>

<FileSaver
	{initialDirectory}
	bind:showModal
	bind:filepath
	{defaultFilename}
	{defaultExtension}
	{confirmOverwrite}
	{title}
/>
