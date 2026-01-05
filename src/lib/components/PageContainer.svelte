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
</style>
