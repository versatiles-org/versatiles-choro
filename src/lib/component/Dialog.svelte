<script lang="ts">
	import type { Snippet } from 'svelte';

	type CloseReason = 'backdrop' | 'escape' | 'action';

	let {
		title,
		children,
		showModal = $bindable(),
		closeOnBackdropClick = true,
		onBeforeClose,
		onClose,
		maxWidth = '32em',
		class: className = ''
	}: {
		title?: string;
		children: Snippet;
		showModal: boolean;
		closeOnBackdropClick?: boolean;
		onBeforeClose?: (reason: CloseReason) => boolean;
		onClose?: (reason: CloseReason) => void;
		maxWidth?: string;
		class?: string;
	} = $props();

	// Generate unique IDs for ARIA labeling
	const titleId = `dialog-title-${Math.random().toString(36).substr(2, 9)}`;
	const descId = `dialog-desc-${Math.random().toString(36).substr(2, 9)}`;

	let dialog: HTMLDialogElement | null = $state(null);
	let previouslyFocusedElement: HTMLElement | null = null;

	// Handle dialog close with reason tracking
	function handleClose(reason: CloseReason) {
		// Allow prevention via callback
		if (onBeforeClose && !onBeforeClose(reason)) {
			return; // Closing prevented
		}

		// Close the dialog
		showModal = false;

		// Fire onClose callback after state update
		onClose?.(reason);
	}

	// Focus trap implementation
	function trapFocus(e: KeyboardEvent) {
		if (e.key !== 'Tab' || !dialog) return;

		const focusableElements = dialog.querySelectorAll<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);

		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];

		if (e.shiftKey && document.activeElement === firstElement) {
			e.preventDefault();
			lastElement?.focus();
		} else if (!e.shiftKey && document.activeElement === lastElement) {
			e.preventDefault();
			firstElement?.focus();
		}
	}

	// Handle Escape key explicitly
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			handleClose('escape');
		}
	}

	// Dialog state effect
	$effect(() => {
		if (showModal && dialog) {
			dialog.showModal();

			// Store previously focused element
			previouslyFocusedElement = document.activeElement as HTMLElement;

			// Focus first focusable element in dialog
			const firstFocusable = dialog.querySelector<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			firstFocusable?.focus();

			// Add focus trap and escape handler
			dialog.addEventListener('keydown', trapFocus);
			dialog.addEventListener('keydown', handleKeydown);
		} else if (!showModal && dialog) {
			dialog.close();

			// Restore focus to previously focused element
			if (previouslyFocusedElement) {
				previouslyFocusedElement.focus();
				previouslyFocusedElement = null;
			}

			// Remove event listeners
			dialog.removeEventListener('keydown', trapFocus);
			dialog.removeEventListener('keydown', handleKeydown);
		}
	});
</script>

<dialog
	bind:this={dialog}
	onclose={() => handleClose('action')}
	onclick={(e) => {
		if (closeOnBackdropClick && e.target === dialog) {
			handleClose('backdrop');
		}
	}}
	aria-modal="true"
	aria-labelledby={title ? titleId : undefined}
	aria-describedby={descId}
	class={className}
	style="--dialog-max-width: {maxWidth}"
>
	{#if title}
		<h2 id={titleId}>{title}</h2>
	{/if}
	<div id={descId}>
		{@render children?.()}
	</div>
</dialog>

<style>
	dialog {
		max-width: var(--dialog-max-width, 32em);
		border-radius: 0.2em;
		border: none;
		padding: 1em;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
