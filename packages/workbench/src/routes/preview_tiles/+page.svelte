<script lang="ts">
	import type { FsFile } from '../../lib/filesystem/filesystem.svelte';
	import FileSelector from '$lib/component/FileSelector.svelte';
	let showModal = $state(true);
	let file: FsFile | null = $state(null);

	$effect(() => {
		if (file) {
			console.log('Selected file:', file.fullPath());
			showModal = false;
		}
	});
</script>

<FileSelector bind:showModal bind:file fileFilter={(name) => /\.(versa|mb|pm)tiles$/.test(name)} />
