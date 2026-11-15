<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Track } from '@fauxfetus/data-generator';
	import { getPlayerContext, getPlayerActions } from '$lib/context/player';

	interface Props {
		track: Track;
		index: number;
		/** Tracks that this row's play button loads into the playlist. */
		playlist: Track[];
		shouldUseIndexAsTrackNumber?: boolean;
		shouldDisableRadioMode?: boolean;
		shouldHideArtist?: boolean;
	}

	let {
		track,
		index,
		playlist,
		shouldUseIndexAsTrackNumber = false,
		shouldDisableRadioMode = false,
		shouldHideArtist = false
	}: Props = $props();

	const playerStore = getPlayerContext();
	const actionsStore = getPlayerActions();
	const actions = $derived($actionsStore);

	function formatTrackNumber(number: number) {
		return number < 10 ? `0${number}` : number;
	}

	function handlePlayButtonClick() {
		actions.loadPlaylist(playlist, index, {
			isRadio: shouldDisableRadioMode ? false : $playerStore.isRadio
		});
	}
</script>

<li>
	{#if shouldUseIndexAsTrackNumber}
		{formatTrackNumber(index + 1)}
	{:else if track.number}
		{formatTrackNumber(track.number)}
	{:else}
		{formatTrackNumber(index + 1)}
	{/if}

	{#if track.isCompilation && !shouldHideArtist}
		<a href={resolve(`/artists/${track.artistSlug}`)}>{track.artistName}</a>
		//
	{/if}

	<a href={resolve(`/artists/${track.artistSlug}/${track.albumSlug}/${track.slug}`)}>
		{track.name}
	</a>

	<button
		type="button"
		aria-label={`Play ${track.name} by ${track.artistName}`}
		onclick={handlePlayButtonClick}
	>
		Play
	</button>
</li>
