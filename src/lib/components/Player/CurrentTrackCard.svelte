<script lang="ts">
	import { resolve } from '$app/paths';

	import { getPlayerContext } from '$lib/context/player';

	import CurrentTrackControls from './CurrentTrackControls.svelte';
	import CurrentTrackProgress from './CurrentTrackProgress.svelte';

	let { position = 0, duration = 0 }: { position: number; duration: number } = $props();

	const playerStore = getPlayerContext();
	const { currentTrackIndex, playlist } = $derived($playerStore);

	const currentTrack = $derived.by(() => {
		return currentTrackIndex != null ? playlist[currentTrackIndex] : null;
	});
</script>

{#if currentTrack}
	<h2>{currentTrack.name}</h2>

	<p>
		from
		<a href={resolve(`/artists/${currentTrack.artistSlug}/${currentTrack.albumSlug}`)}>
			{currentTrack.albumName}
		</a>
		by
		<a href={resolve(`/artists/${currentTrack.artistSlug}`)}>{currentTrack.artistName}</a>
	</p>

	<CurrentTrackControls />

	<CurrentTrackProgress {position} {duration} />
{/if}
