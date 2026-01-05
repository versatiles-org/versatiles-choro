<script lang="ts">
	import type { Snippet } from 'svelte';

	const {
		children
	}: {
		children?: Snippet;
	} = $props();
</script>

<div class="sidebar">
	{@render children?.()}
</div>

<style>
	.sidebar {
		width: 300px;
		height: 100%;
		padding: 1em;
		border-right: 1px solid var(--color-border-light);
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		background-color: var(--color-bg-primary);
	}
</style>
