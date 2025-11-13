<script lang="ts">
	import Dialog from './Dialog.svelte';

	let { url, params }: { url: string; params: Record<string, unknown> } = $props();

	let percentage = $state(0);
	let message = $state('');
	let visible = $state(true);
	const controller = new AbortController();

	$effect(() => {
		createConvertPolygonsStores();
	});

	export async function createConvertPolygonsStores() {
		const decoder = new TextDecoder();
		let buffer = '';

		const response = await fetch(url, {
			method: 'POST',
			body: JSON.stringify(params),
			headers: { 'Content-Type': 'application/json' },
			signal: controller.signal
		});

		const reader = response.body?.getReader();
		if (!reader) return;

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });

			let idx;
			while ((idx = buffer.indexOf('\n')) !== -1) {
				const line = buffer.slice(0, idx).trim();
				buffer = buffer.slice(idx + 1);
				if (!line) continue;

				const evt = JSON.parse(line);
				switch (evt.event) {
					case 'progress':
						percentage = Number(evt.data);
						break;
					case 'message':
						message = String(evt.data);
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
	}
</script>

<Dialog title="Conversion Progress" bind:showModal={visible}>
	<div class="progress-container" class:invisible={!visible}>
		<div class="progress-bar" style="width: {percentage}%;"></div>
		<div class="progress-text">
			{#if message}
				<span class="progress-message">{message}</span>
			{/if}
			<span class="progress-percentage">{percentage.toFixed(0)}%</span>
		</div>
	</div>
	<button onclick={() => controller.abort()}>Abort</button>
</Dialog>

<style>
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
		background-color:hsl(220, 100%, 40%);
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
		justify-content: space-around;
		padding: 0 12px;
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
