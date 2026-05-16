<script lang="ts">
	import { resolve } from '$app/paths';

	import { togglePlayerDrawer } from '$lib/helpers/player';
	import { getPlayerContext } from '$lib/context/player';

	import CurrentTrackControls from './CurrentTrackControls.svelte';
	import CurrentTrackProgress from './CurrentTrackProgress.svelte';

	const playerStore = getPlayerContext();
	const { currentTrackIndex, playlist } = $derived($playerStore);

	const currentTrack = $derived.by(() => {
		return currentTrackIndex != null ? playlist[currentTrackIndex] : null;
	});
</script>

{#if currentTrack}
	<div class="card w-full bg-neutral text-neutral-content">
		<div class="card-body items-center text-center">
			<h2 class="card-title">{currentTrack.name}</h2>

			<p>
				from <a
					href={resolve(`/artists/${currentTrack.artistSlug}/${currentTrack.albumSlug}`)}
					class="link-primary"
					onclick={togglePlayerDrawer}>{currentTrack.albumName}</a
				>
				by
				<a
					href={resolve(`/artists/${currentTrack.artistSlug}`)}
					class="link-primary"
					onclick={togglePlayerDrawer}>{currentTrack.artistName}</a
				>
			</p>

			<div class="card-actions justify-end">
				<CurrentTrackControls />
			</div>

			<CurrentTrackProgress />
		</div>
	</div>
{/if}
