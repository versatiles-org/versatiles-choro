<script lang="ts">
	import type { FsFile } from '../../lib/filesystem/filesystem.svelte';
	import FileSelector from '$lib/component/FileSelector.svelte';
	let showModal = $state(true);
	let file: FsFile | null = $state(null);
</script>

<FileSelector bind:showModal bind:file />
