<script lang="ts">
	import { type Snippet } from 'svelte';
	import { slide } from 'svelte/transition';
	import { generateId } from '$lib/utils/id.js';

	let {
		title,
		children,
		open,
		disabled
	}: {
		title: string;
		children?: Snippet;
		open?: boolean;
		disabled?: boolean;
	} = $props();
	const iconOpen: string = '▾';
	const iconClosed: string = '▸';

	const contentId = generateId('foldable');

	function toggle() {
		if (disabled) return;
		open = !open;
	}
</script>

<div class="foldable">
	<button
		type="button"
		class="header"
		aria-expanded={open}
		aria-controls={contentId}
		onclick={toggle}
		{disabled}
	>
		<span class="icon" aria-hidden="true">{open ? iconOpen : iconClosed}</span>
		<span class="title">{title}</span>
	</button>

	{#if open}
		<div class="content" id={contentId} role="region" aria-label={title} transition:slide>
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.foldable {
		--foldable-border: var(--color-border-light);
		--foldable-bg: var(--color-bg-subtle);
		--foldable-header-bg: var(--color-bg-muted);
		--foldable-radius: var(--radius-sm);
		margin: 0.2rem 0.2rem 0.2rem 1rem;
		box-sizing: border-box;
	}

	.header {
		all: unset;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		width: 100%;
		padding: 0.3rem 0.3rem;
		cursor: pointer;
		background: var(--foldable-header-bg);
		border: 1px solid var(--foldable-border);
		border-radius: var(--foldable-radius);
		font-size: 0.9rem;
		line-height: 1.2;
		user-select: none;
		box-sizing: border-box;
	}
	.header:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}
	.header:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.icon {
		width: 1em;
		display: inline-flex;
		justify-content: center;
		transition: transform 0.2s;
	}

	.title {
		flex: 1;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.content {
		padding: 0.5rem 0.75rem 0.75rem;
		border: 1px solid var(--foldable-border);
		border-top: none;
		border-radius: 0 0 var(--foldable-radius) var(--foldable-radius);
		background: var(--foldable-bg);
		font-size: 0.85rem;
	}
</style>
