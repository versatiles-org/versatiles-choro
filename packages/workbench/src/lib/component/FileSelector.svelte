<script lang="ts">
	import Dialog from './Dialog.svelte';
	import { FsDirectory, FsFile, getRootDirectory } from '$lib/filesystem/filesystem.svelte';
	import type { filterItems } from 'valibot';

	let {
		initialDirectory,
		showModal = $bindable(),
		file = $bindable(),
		fileFilter
	}: {
		initialDirectory?: FsDirectory;
		showModal: boolean;
		file: FsFile | null;
		fileFilter?: (name: string) => boolean;
	} = $props();

	let dir = $state(initialDirectory || getRootDirectory());
</script>

<Dialog bind:showModal>
	<div class="file-selector">
		<h3>Current Directory: {dir.fullPath()}</h3>
		<div>
			{#if dir.getParent()}
				<button class="directory" onclick={() => (dir = dir.getParent()!)}>..</button>
			{/if}
			{#each await dir.getChildren() as child (child)}
				{#if child instanceof FsDirectory}
					<button class="directory" onclick={() => (dir = child)}>{child.getName()}/</button>
				{:else}
					<button
						class={{ file, disabled: fileFilter && !fileFilter(child.getName()) }}
						onclick={() => (file = child)}>{child.getName()}</button
					>
				{/if}
			{/each}
		</div>
	</div>
</Dialog>

<style>
	:global(dialog) {
		min-width: 80vw;
	}
	button {
		all: unset;
		cursor: pointer;
		border: none;
		background: none;
		display: block;
		text-align: left;
		width: 100%;
	}
	button:hover {
		background-color: #f0f0f0;
	}
	button.disabled {
		opacity: 0.3;
		pointer-events: none;
	}
</style>
