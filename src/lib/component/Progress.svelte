<script lang="ts">
	import { ProgressStatus } from '$lib/api/basics';
	import Dialog from './Dialog.svelte';
	import * as v from 'valibot';

	let { url, params }: { url: string; params: Record<string, unknown> } = $props();

	let percentage = $state(0);
	let message = $state('');
	let visible = $state(true);
	let controller: AbortController;

	// Legitimate side effect: network request for progress streaming
	$effect(() => {
		controller = new AbortController();

		async function fetchProgress() {
			try {
				const decoder = new TextDecoder();
				let buffer = '';

				const response = await fetch(url, {
					method: 'POST',
					body: JSON.stringify(params),
					headers: { 'Content-Type': 'application/json' },
					signal: controller.signal
				});

				if (!response.ok || !response.body) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const reader = response.body.getReader();

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });

					let idx;
					while ((idx = buffer.indexOf('\n')) !== -1) {
						const line = buffer.slice(0, idx).trim();
						buffer = buffer.slice(idx + 1);
						if (!line) continue;

						const evt = v.parse(ProgressStatus, JSON.parse(line));
						switch (evt.event) {
							case 'progress':
								percentage = Number(evt.progress);
								break;
							case 'message':
								message = String(evt.message);
								break;
							case 'done':
								visible = false;
								break;
							case 'error':
								visible = false;
								break;
						}
					}
				}
			} catch (error) {
				// Ignore AbortError - it's expected when component unmounts or user aborts
				if (error instanceof Error && error.name !== 'AbortError') {
					message = `Error: ${error.message}`;
					visible = false;
				}
			}
		}

		fetchProgress();

		// Cleanup function: abort fetch when component unmounts or effect re-runs
		return () => {
			controller.abort();
		};
	});
</script>

<Dialog title="Conversion Progress" bind:showModal={visible} width="400px">
	{#if message}
		<div class="progress-message">{message}</div>
	{/if}
	<div class="progress-container" class:invisible={!visible}>
		<div class="progress-bar" style="width: {percentage}%;"></div>
		<div class="progress-text">
			<span class="progress-percentage">{percentage.toFixed(0)}%</span>
		</div>
	</div>
	<button onclick={() => controller.abort()}>Abort</button>
</Dialog>

<style>
	.progress-message {
		width: 100%;
		margin-bottom: 4px;
		font-size: 14px;
		color: hsl(220, 20%, 20%);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.progress-container {
		position: relative;
		width: 100%;
		height: 24px;
		background-color: hsl(220, 100%, 70%);
		border-radius: 8px;
		overflow: hidden;
		transition: opacity 0.5s ease-out;
	}

	.progress-bar {
		height: 100%;
		background-color: hsl(220, 100%, 40%);
		transition: width 0.2s ease-in-out;
	}

	.progress-text {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		font-size: 14px;
		color: #ffffff;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
		pointer-events: none;
	}

	.invisible {
		opacity: 0;
		pointer-events: none;
	}
</style>
