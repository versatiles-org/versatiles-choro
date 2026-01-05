<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		children
	}: {
		title: string;
		children: Snippet;
	} = $props();
</script>

<div class="page-container">
	<div class="page-header">
		<h1>{title}</h1>
	</div>
	<div class="page-content">
		{@render children()}
	</div>
</div>

<style>
	.page-container {
		height: 100%;
		overflow-y: auto;
		background: linear-gradient(135deg, var(--color-bg-subtle) 0%, var(--color-bg-muted) 100%);
	}

	.page-header {
		background: var(--color-bg-primary);
		border-bottom: 2px solid var(--color-border-default);
		padding: 2rem;
		box-shadow: var(--shadow-button);
	}

	.page-header h1 {
		margin: 0;
		font-size: 2rem;
		color: var(--color-text-primary);
		font-weight: 600;
	}

	.page-content {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}
</style>
