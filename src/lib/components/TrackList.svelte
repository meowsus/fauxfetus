<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Track } from '@fauxfetus/data-generator';
	import { getPlayerContext, getPlayerActions } from '#lib/context/player.js';

	interface Props {
		tracks: Track[];
		/** Hide the guest-artist link inside compilation albums. */
		shouldHideArtist?: boolean;
	}

	let { tracks, shouldHideArtist = false }: Props = $props();

	const playerStore = getPlayerContext();
	const actionsStore = getPlayerActions();

	// Which row the persistent pill is currently playing, if any. audioUrl
	// is unique per track across the catalog, so it identifies rows even
	// after the player has moved on to a different playlist (e.g. radio).
	const currentAudioUrl = $derived(
		$playerStore.currentTrackIndex == null
			? undefined
			: $playerStore.playlist[$playerStore.currentTrackIndex]?.audioUrl
	);

	function formatTrackNumber(number: number | null, index: number): string {
		const value = number ?? index + 1;
		return value < 10 ? `0${value}` : String(value);
	}
</script>

<ol class="tracks tnum">
	{#each tracks as track, index (track.audioUrl)}
		{@const playing = track.audioUrl === currentAudioUrl}
		<li class:playing>
			<a href={resolve(`artists/${track.artistSlug}/${track.albumSlug}/${track.slug}`)}>
				<span class="no tnum dim">{formatTrackNumber(track.number, index)}</span>
				<span class="trname">{track.name}</span>
				{#if track.isCompilation && !shouldHideArtist}
					<span class="by">{track.artistName}</span>
				{/if}
			</a>
			<button
				type="button"
				class="cap dim"
				aria-label={`Play ${track.name} by ${track.artistName}`}
				onclick={() => $actionsStore.loadPlaylist(tracks, index, { isRadio: false })}
			>
				{playing ? 'playing' : 'play'}
			</button>
		</li>
	{/each}
</ol>
