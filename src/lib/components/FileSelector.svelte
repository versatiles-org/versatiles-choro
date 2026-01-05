<script lang="ts">
	import Dialog from './Dialog.svelte';
	import { FsDirectory, FsFile, getRootDirectory } from '$lib/api/filesystem.svelte';
	import { formatFileSize, formatDate } from '$lib/utils/format';
	import { Folder, File, FileText, FileImage, FileCode, ChevronRight, House } from '@lucide/svelte';
	import '$lib/styles/file-browser.css';

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

	// Build breadcrumb path
	function getBreadcrumbs(): FsDirectory[] {
		const crumbs: FsDirectory[] = [];
		let current: FsDirectory | null = dir;
		while (current) {
			crumbs.unshift(current);
			current = current.getParent();
		}
		return crumbs;
	}

	// Get icon component based on file extension
	function getFileIcon(filename: string) {
		const ext = filename.split('.').pop()?.toLowerCase() ?? '';
		const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'];
		const codeExts = ['ts', 'js', 'svelte', 'json', 'css', 'html', 'tsx', 'jsx'];
		const textExts = ['txt', 'md', 'csv', 'log'];

		if (imageExts.includes(ext)) return FileImage;
		if (codeExts.includes(ext)) return FileCode;
		if (textExts.includes(ext)) return FileText;
		return File;
	}
</script>

<Dialog bind:showModal width="700px">
	<div class="file-browser">
		<h3>{title}</h3>

		<!-- Breadcrumb navigation -->
		<nav class="breadcrumbs">
			{#each getBreadcrumbs() as crumb, i (crumb.fullPath())}
				{#if i > 0}
					<ChevronRight size={14} class="separator" />
				{/if}
				<button
					class="breadcrumb"
					class:current={crumb === dir}
					onclick={() => (dir = crumb)}
					disabled={crumb === dir}
				>
					{#if i === 0}
						<House size={14} />
					{:else}
						{crumb.getName()}
					{/if}
				</button>
			{/each}
		</nav>

		<!-- File list -->
		<div class="file-list">
			<div class="file-header">
				<span class="col-icon"></span>
				<span class="col-name">Name</span>
				<span class="col-size">Size</span>
				<span class="col-date">Modified</span>
			</div>

			{#if dir.getParent()}
				<button class="file-row folder" onclick={() => (dir = dir.getParent()!)}>
					<span class="col-icon"><Folder size={16} /></span>
					<span class="col-name">..</span>
					<span class="col-size"></span>
					<span class="col-date"></span>
				</button>
			{/if}

			{#each await dir.getChildren() as child (child)}
				{#if child instanceof FsDirectory}
					<button class="file-row folder" onclick={() => (dir = child)}>
						<span class="col-icon"><Folder size={16} /></span>
						<span class="col-name">{child.getName()}</span>
						<span class="col-size"></span>
						<span class="col-date"></span>
					</button>
				{:else}
					{@const isDisabled = fileFilter && !fileFilter(child.getName())}
					{@const IconComponent = getFileIcon(child.getName())}
					<button
						class="file-row file"
						class:disabled={isDisabled}
						onclick={() => {
							if (!isDisabled) {
								file = child;
								showModal = false;
							}
						}}
					>
						<span class="col-icon"><IconComponent size={16} /></span>
						<span class="col-name">{child.getName()}</span>
						<span class="col-size">{formatFileSize(child.getSize())}</span>
						<span class="col-date">{formatDate(child.getMtime())}</span>
					</button>
				{/if}
			{/each}
		</div>

		<!-- Actions -->
		<div class="actions">
			<button class="button button-secondary" onclick={() => (showModal = false)}>Cancel</button>
		</div>
	</div>
</Dialog>

<style>
	/* FileSelector-specific styles */
	.file-row {
		cursor: pointer;
	}

	.file-row:hover:not(.disabled) {
		background: var(--color-bg-highlight);
	}

	.file-row.disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
