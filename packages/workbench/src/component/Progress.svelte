<script lang="ts">
	import type { Progress } from '@versatiles-choro/engine';

	let { progress } = $props() as {
		progress: Progress;
	};

	let percentage = $state(0);
	let message = $state('');
	let visible = $state(true);

	progress.onProgress((p) => {
		percentage = p;
	});
	progress.onMessage((m) => {
		message = m;
	});
	progress.onComplete(() => {
		visible = false;
	});
</script>

<div class="progress-container" class:invisible={!visible}>
	<div class="progress-bar" style="width: {percentage}%;"></div>
	<div class="progress-text">
		{#if message}
			<span class="progress-message">{message}</span>
		{/if}
		<span class="progress-percentage">{percentage.toFixed(2)}%</span>
	</div>
	<button onclick={() => progress.abort()}>Abort</button>
</div>

<style>
	.progress-container {
		position: relative;
		width: 100%;
		height: 24px;
		background-color: #e0e0e0;
		border-radius: 12px;
		overflow: hidden;
		transition: opacity 0.5s ease-out;
	}

	.progress-bar {
		height: 100%;
		background-color: #76c7c0;
		transition: width 0.3s ease-in-out;
	}

	.progress-text {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
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
