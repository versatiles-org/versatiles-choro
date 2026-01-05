<script lang="ts">
	import SidebarFoldable from './SidebarFoldable.svelte';

	let {
		title,
		content,
		open,
		disabled
	}: {
		title: string;
		content?: string;
		open?: boolean;
		disabled?: boolean;
	} = $props();
</script>

<SidebarFoldable {title} {open} {disabled}>
	{#if content}
		{content}
	{/if}
</SidebarFoldable>
