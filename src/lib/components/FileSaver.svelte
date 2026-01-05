<script lang="ts">
	import Dialog from './Dialog.svelte';
	import { FsDirectory, FsFile, getRootDirectory } from '$lib/api/filesystem.svelte';
	import { formatFileSize, formatDate } from '$lib/utils/format';
	import {
		Folder,
		File,
		FileText,
		FileImage,
		FileCode,
		ChevronRight,
		House,
		TriangleAlert
	} from '@lucide/svelte';

	let {
		initialDirectory,
		showModal = $bindable(),
		filepath = $bindable(),
		defaultFilename = '',
		defaultExtension = '',
		confirmOverwrite = true,
		title = 'Save File'
	}: {
		initialDirectory?: FsDirectory;
		showModal: boolean;
		filepath: string | undefined;
		defaultFilename?: string;
		defaultExtension?: string;
		confirmOverwrite?: boolean;
		title?: string;
	} = $props();

	let dir = $state<FsDirectory>(getRootDirectory());
	let filename = $state('');

	// Initialize state from props (one-time capture at component mount)
	$effect.pre(() => {
		if (initialDirectory) dir = initialDirectory;
		if (defaultFilename) filename = defaultFilename;
	});

	let showOverwriteWarning = $state(false);
	let existingFiles = $state<string[]>([]);

	// Load existing files in current directory
	async function loadDirectory() {
		const children = await dir.getChildren();
		existingFiles = children.filter((c) => c instanceof FsFile).map((f) => f.getName());
	}

	// Validate and save
	function handleSave() {
		// Ensure extension is added
		let finalFilename = filename.trim();
		if (defaultExtension && !finalFilename.endsWith(defaultExtension)) {
			finalFilename += defaultExtension;
		}

		// Check if file exists
		if (confirmOverwrite && existingFiles.includes(finalFilename)) {
			showOverwriteWarning = true;
			return;
		}

		// Return full path
		filepath = dir.fullPath() + '/' + finalFilename;
		showModal = false;
	}

	function confirmOverwriteAction() {
		showOverwriteWarning = false;
		let finalFilename = filename.trim();
		if (defaultExtension && !finalFilename.endsWith(defaultExtension)) {
			finalFilename += defaultExtension;
		}
		filepath = dir.fullPath() + '/' + finalFilename;
		showModal = false;
	}

	// Legitimate side effect: async file system operation to list directory contents
	$effect(() => {
		loadDirectory();
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
					{@const IconComponent = getFileIcon(child.getName())}
					<div class="file-row file existing">
						<span class="col-icon"><IconComponent size={16} /></span>
						<span class="col-name">{child.getName()}</span>
						<span class="col-size">{formatFileSize(child.getSize())}</span>
						<span class="col-date">{formatDate(child.getMtime())}</span>
					</div>
				{/if}
			{/each}
		</div>

		<!-- Filename input -->
		<div class="filename-section">
			<label for="filename">Save as:</label>
			<div class="filename-input">
				<input
					id="filename"
					type="text"
					class="input-mono"
					bind:value={filename}
					placeholder="Enter filename"
					onkeydown={(e) => {
						if (e.key === 'Enter' && filename.trim()) {
							handleSave();
						}
					}}
				/>
				{#if defaultExtension}
					<span class="extension">{defaultExtension}</span>
				{/if}
			</div>
		</div>

		<!-- Actions -->
		<div class="actions">
			<button class="button-secondary" onclick={() => (showModal = false)}>Cancel</button>
			<button class="button-primary" onclick={handleSave} disabled={!filename.trim()}>Save</button>
		</div>

		<!-- Overwrite warning -->
		{#if showOverwriteWarning}
			<div class="overwrite-warning">
				<div class="warning-content">
					<TriangleAlert size={20} />
					<p>A file with this name already exists. Do you want to replace it?</p>
				</div>
				<div class="warning-actions">
					<button class="button-secondary" onclick={() => (showOverwriteWarning = false)}
						>Cancel</button
					>
					<button class="button-danger" onclick={confirmOverwriteAction}>Replace</button>
				</div>
			</div>
		{/if}
	</div>
</Dialog>

<style>
	.file-browser {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	h3 {
		margin: 0;
		font-weight: 500;
	}

	/* Breadcrumbs */
	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
		background: var(--color-bg-muted);
		border-radius: var(--radius-sm);
		overflow-x: auto;
	}

	.breadcrumbs :global(.separator) {
		color: var(--color-icon-separator);
		flex-shrink: 0;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border: none;
		background: none;
		border-radius: 3px;
		cursor: pointer;
		font-size: 0.85rem;
		color: var(--color-link);
		white-space: nowrap;
	}

	.breadcrumb:hover:not(:disabled) {
		background: var(--color-bg-hover);
	}

	.breadcrumb.current {
		color: var(--color-text-primary);
		cursor: default;
	}

	/* File list */
	.file-list {
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-sm);
		max-height: 300px;
		overflow-y: auto;
	}

	.file-header {
		display: grid;
		grid-template-columns: 28px 1fr 80px 100px;
		gap: 0.5rem;
		padding: 0.5rem;
		background: var(--color-bg-subtle);
		border-bottom: 1px solid var(--color-border-light);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		position: sticky;
		top: 0;
	}

	.file-row {
		display: grid;
		grid-template-columns: 28px 1fr 80px 100px;
		gap: 0.5rem;
		padding: 0.5rem;
		border: none;
		background: none;
		width: 100%;
		text-align: left;
		border-bottom: 1px solid var(--color-border-lighter);
	}

	.file-row:last-child {
		border-bottom: none;
	}

	button.file-row:hover {
		background: var(--color-bg-highlight);
		cursor: pointer;
	}

	.file-row.folder {
		color: var(--color-link);
	}

	.file-row.folder :global(svg) {
		color: var(--color-icon-folder);
	}

	.file-row.file :global(svg) {
		color: var(--color-icon-file);
	}

	.file-row.existing {
		opacity: 0.6;
	}

	.col-icon {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.col-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		font-size: 0.9rem;
	}

	.col-size,
	.col-date {
		font-family: monospace;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		text-align: right;
	}

	/* Filename input */
	.filename-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filename-section label {
		font-weight: 500;
		font-size: 0.9rem;
	}

	.filename-input {
		display: flex;
		align-items: center;
		gap: 0;
	}

	.filename-input input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-sm) 0 0 var(--radius-sm);
		font-size: 0.9rem;
	}

	.filename-input input:focus {
		outline: none;
		border-color: var(--color-focus);
	}

	.extension {
		padding: 0.5rem 0.75rem;
		background: var(--color-bg-muted);
		border: 1px solid var(--color-border-light);
		border-left: none;
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
		font-family: monospace;
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	/* Actions */
	.actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	/* Overwrite warning */
	.overwrite-warning {
		padding: 1rem;
		background: var(--color-warning-50);
		border: 1px solid var(--color-warning-500);
		border-radius: var(--radius-sm);
	}

	.warning-content {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.warning-content :global(svg) {
		color: var(--color-warning-text);
		flex-shrink: 0;
		margin-top: 0.1rem;
	}

	.warning-content p {
		margin: 0;
		color: var(--color-warning-text);
	}

	.warning-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}
</style>
