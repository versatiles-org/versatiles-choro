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
		background: linear-gradient(135deg, hsl(220, 40%, 98%) 0%, hsl(220, 40%, 96%) 100%);
	}

	.page-header {
		background: white;
		border-bottom: 2px solid hsl(220, 30%, 90%);
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.page-header h1 {
		margin: 0;
		font-size: 2rem;
		color: hsl(220, 20%, 20%);
		font-weight: 600;
	}

	.page-content {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.page-content :global(h2) {
		color: hsl(220, 20%, 30%);
		font-size: 1.5rem;
		margin: 2rem 0 1rem 0;
		font-weight: 600;
	}

	.page-content :global(h3) {
		color: hsl(220, 20%, 35%);
		font-size: 1.25rem;
		margin: 1.5rem 0 1rem 0;
		font-weight: 500;
	}

	.page-content :global(p) {
		color: hsl(220, 20%, 40%);
		line-height: 1.6;
		margin: 0.75rem 0;
	}

	.page-content :global(button) {
		background: hsl(220, 80%, 50%);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.page-content :global(button:hover) {
		background: hsl(220, 80%, 45%);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
	}

	.page-content :global(button:active) {
		transform: translateY(0);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.page-content :global(button:disabled) {
		background: hsl(220, 20%, 70%);
		cursor: not-allowed;
		opacity: 0.6;
		transform: none;
	}

	.page-content :global(.info-card) {
		background: white;
		border: 1px solid hsl(220, 30%, 90%);
		border-radius: 8px;
		padding: 1.5rem;
		margin: 1rem 0;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.page-content :global(.info-card p) {
		margin: 0;
	}

	.page-content :global(.step-section) {
		background: white;
		border: 1px solid hsl(220, 30%, 90%);
		border-radius: 8px;
		padding: 1.5rem;
		margin: 1.5rem 0;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.page-content :global(.step-section h3) {
		margin-top: 0;
	}
</style>
