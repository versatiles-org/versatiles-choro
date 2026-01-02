<script lang="ts">
	import Dialog from './Dialog.svelte';

	type CloseReason = 'backdrop' | 'escape' | 'action';

	let {
		title,
		showModal = $bindable(),
		content,
		closeOnBackdropClick,
		onBeforeClose,
		onClose,
		width,
		class: className
	}: {
		title?: string;
		showModal: boolean;
		content?: string;
		closeOnBackdropClick?: boolean;
		onBeforeClose?: (reason: CloseReason) => boolean;
		onClose?: (reason: CloseReason) => void;
		width?: string;
		class?: string;
	} = $props();
</script>

<Dialog
	{title}
	bind:showModal
	{closeOnBackdropClick}
	{onBeforeClose}
	{onClose}
	{width}
	class={className}
>
	{#if content}
		{content}
	{/if}
</Dialog>
