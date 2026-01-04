<script lang="ts">
	import Dialog from './Dialog.svelte';
	import { FsDirectory, FsFile, getRootDirectory } from '$lib/api/filesystem.svelte';

	let {
		initialDirectory,
		showModal = $bindable(),
		file = $bindable(),
		fileFilter,
		title = 'Select File'
	}: {
		initialDirectory?: FsDirectory;
		showModal: boolean;
		file: FsFile | undefined;
		fileFilter?: (name: string) => boolean;
		title?: string;
	} = $props();

	let dir = $state<FsDirectory>(getRootDirectory());

	// Initialize state from props (one-time capture at component mount)
	$effect.pre(() => {
		if (initialDirectory) dir = initialDirectory;
	});
</script>

<Dialog bind:showModal width="80vw">
	<div class="file-selector">
		<h3>{title}</h3>
		<p>{dir.fullPath()}</p>
		<div>
			{#if dir.getParent()}
				<button class="directory" onclick={() => (dir = dir.getParent()!)}>..</button>
			{/if}
			{#each await dir.getChildren() as child (child)}
				{#if child instanceof FsDirectory}
					<button class="directory" onclick={() => (dir = child)}>{child.getName()}/</button>
				{:else}
					<button
						class={{ file: true, disabled: fileFilter && !fileFilter(child.getName()) }}
						onclick={() => {
							file = child;
							showModal = false;
						}}>{child.getName()}</button
					>
				{/if}
			{/each}
		</div>
	</div>
</Dialog>

<style>
	button.directory,
	button.file {
		all: unset;
		font-family: monospace;
		cursor: pointer;
		border: none;
		background: none;
		display: block;
		text-align: left;
		width: 100%;
	}
	button.directory:hover,
	button.file:hover {
		background-color: #f0f0f0;
	}
	button.file.disabled {
		opacity: 0.3;
		pointer-events: none;
	}
	h3 {
		margin: 0;
	}
</style>
