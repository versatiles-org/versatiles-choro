<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LucideIcon } from '@lucide/svelte';

	const {
		children,
		Icon,
		title = '',
		borderBottom = true
	}: {
		children?: Snippet;
		Icon: LucideIcon;
		title: string;
		borderBottom?: boolean;
	} = $props();
</script>

<div
	class="frame"
	style:border-bottom={borderBottom ? '1px solid var(--color-border-light)' : 'none'}
>
	<h4><Icon style="vertical-align: -0.3em;" strokeWidth={1.5} /> {title}</h4>
	<div class="content">
		{@render children?.()}
	</div>
</div>

<style>
	.frame {
		margin-bottom: 2em;
	}
	h4 {
		all: unset;
	}
	.content {
		padding: 1em 0 2em;
	}
</style>
