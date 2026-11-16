<script lang="ts">
	import { updated } from '$app/state';

	function refresh() {
		window.location.reload();
	}

	$effect(() => {
		// Periodically check for updates (every 30 minutes)
		// so long-running PWAs discover new versions
		const interval = setInterval(
			() => {
				updated.check();
			},
			30 * 60 * 1000
		);

		return () => clearInterval(interval);
	});
</script>

{#if updated.current}
	<div role="alert">
		<span>A new version is available</span>
		<button type="button" onclick={refresh}>Update</button>
	</div>
{/if}

<style>
	/* slim update notice: a quiet pill at the top, far from the player */
	div[role='alert'] {
		position: fixed;
		top: calc(1rem + env(safe-area-inset-top));
		inset-inline: 0;
		margin-inline: auto;
		z-index: 30;
		width: fit-content;
		display: flex;
		align-items: center;
		gap: 0.9rem;
		background: rgb(19 20 27 / 0.95);
		backdrop-filter: blur(18px);
		border: 1px solid rgb(236 233 244 / 0.24);
		border-radius: 999px;
		padding: 0.5em 0.9em 0.5em 1.1em;
		box-shadow: 0 12px 32px rgb(0 0 0 / 0.5);
		font-size: 0.7rem;
		font-weight: 500;
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}

	span {
		color: var(--dim);
	}

	button {
		color: var(--violet);
		padding: 0.3em 0.4em;
		border-radius: 2px;
	}

	button:hover {
		background: var(--violet);
		color: #0e0f13;
	}
</style>
