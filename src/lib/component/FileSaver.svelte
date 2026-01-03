<script lang="ts">
	import Dialog from './Dialog.svelte';
	import { FsDirectory, FsFile, getRootDirectory } from '$lib/api/filesystem.svelte';

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

	let dir = $state<FsDirectory>(initialDirectory ?? getRootDirectory());
	let filename = $state(defaultFilename ?? '');
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

	$effect(() => {
		loadDirectory();
	});
</script>

<Dialog bind:showModal width="80vw">
	<div class="file-saver">
		<h3>{title}</h3>
		<p>{dir.fullPath()}</p>

		<!-- Directory navigation -->
		<div class="directory-list">
			{#if dir.getParent()}
				<button class="directory" onclick={() => (dir = dir.getParent()!)}>..</button>
			{/if}
			{#each await dir.getChildren() as child (child)}
				{#if child instanceof FsDirectory}
					<button class="directory" onclick={() => (dir = child)}>{child.getName()}/</button>
				{:else}
					<div class="existing-file">{child.getName()}</div>
				{/if}
			{/each}
		</div>

		<!-- Filename input -->
		<div class="filename-input">
			<label for="filename">Filename:</label>
			<input
				id="filename"
				type="text"
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

		<!-- Actions -->
		<div class="actions">
			<button onclick={() => (showModal = false)}>Cancel</button>
			<button onclick={handleSave} disabled={!filename.trim()}>Save</button>
		</div>

		<!-- Overwrite warning -->
		{#if showOverwriteWarning}
			<div class="overwrite-warning">
				<p><strong>Warning:</strong> File already exists. Do you want to overwrite it?</p>
				<div class="warning-actions">
					<button onclick={() => (showOverwriteWarning = false)}>Cancel</button>
					<button class="danger" onclick={confirmOverwriteAction}>Overwrite</button>
				</div>
			</div>
		{/if}
	</div>
</Dialog>

<style>
	.file-saver {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	h3 {
		margin: 0;
	}

	p {
		margin: 0;
		font-family: monospace;
		font-size: 0.9em;
		color: #666;
	}

	.directory-list {
		max-height: 300px;
		overflow-y: auto;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 0.5em;
	}

	button.directory {
		all: unset;
		font-family: monospace;
		cursor: pointer;
		display: block;
		text-align: left;
		width: 100%;
		padding: 2px 4px;
	}

	button.directory:hover {
		background-color: #f0f0f0;
	}

	.existing-file {
		font-family: monospace;
		opacity: 0.5;
		padding: 2px 4px;
	}

	.filename-input {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.filename-input label {
		font-weight: bold;
		white-space: nowrap;
	}

	.filename-input input {
		flex: 1;
		padding: 0.5em;
		font-family: monospace;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	.filename-input input:focus {
		outline: none;
		border-color: #4a90e2;
	}

	.extension {
		font-family: monospace;
		color: #666;
		white-space: nowrap;
	}

	.actions {
		display: flex;
		gap: 0.5em;
		justify-content: flex-end;
	}

	.actions button {
		padding: 0.5em 1em;
		border: 1px solid #ccc;
		border-radius: 4px;
		background-color: white;
		cursor: pointer;
	}

	.actions button:hover {
		background-color: #f0f0f0;
	}

	.actions button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.actions button:not(:disabled):hover {
		background-color: #e0e0e0;
	}

	.overwrite-warning {
		margin-top: 1em;
		padding: 1em;
		background-color: #fff3cd;
		border: 1px solid #ffc107;
		border-radius: 4px;
	}

	.overwrite-warning p {
		margin: 0 0 1em 0;
		color: #856404;
		font-family: inherit;
		font-size: inherit;
	}

	.warning-actions {
		display: flex;
		gap: 0.5em;
		justify-content: flex-end;
	}

	.warning-actions button {
		padding: 0.5em 1em;
		border: 1px solid #ccc;
		border-radius: 4px;
		background-color: white;
		cursor: pointer;
	}

	.warning-actions button.danger {
		background-color: #dc3545;
		color: white;
		border-color: #dc3545;
	}

	.warning-actions button:hover {
		opacity: 0.9;
	}
</style>
