<script lang="ts">
	import { updated } from '$app/stores';

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

{#if $updated}
	<div role="alert">
		<span>A new version is available</span>
		<button type="button" onclick={refresh}>Update</button>
	</div>
{/if}
