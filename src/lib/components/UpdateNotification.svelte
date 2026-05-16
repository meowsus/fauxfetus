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
	<div class="toast toast-center toast-bottom z-50">
		<div role="alert" class="alert alert-vertical shadow-lg sm:alert-horizontal">
			<span class="icon-[line-md--backup-restore] shrink-0"></span>
			<span>A new version is available</span>
			<button class="btn btn-sm btn-primary" onclick={refresh}>Update</button>
		</div>
	</div>
{/if}
