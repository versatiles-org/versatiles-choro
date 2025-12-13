<script lang="ts">
	import Dialog from './Dialog.svelte';

	let {
		title,
		showModal = $bindable(),
		content
	}: {
		title?: string;
		showModal: boolean;
		content?: string;
	} = $props();
</script>

<Dialog {title} bind:showModal>
	{#if content}
		{content}
	{/if}
</Dialog>
