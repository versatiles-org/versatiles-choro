<script lang="ts">
	import SidebarFrame from './SidebarFrame.svelte';
	import { Settings } from '@lucide/svelte';

	let {
		title = 'Test Title',
		content = undefined,
		borderBottom = true
	}: { title?: string; content?: string | undefined; borderBottom?: boolean } = $props();
</script>

<SidebarFrame Icon={Settings} {title} {borderBottom}>
	{#if content !== undefined}
		{content}
	{/if}
</SidebarFrame>
