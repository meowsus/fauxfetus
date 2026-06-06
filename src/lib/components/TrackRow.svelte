<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Track } from '@fauxfetus/generator';
	import { getPlayerContext, getPlayerActions } from '$lib/context/player';
	import { togglePlayerDrawer } from '$lib/helpers/player';
	import { cn } from '$lib/helpers/tailwind';

	interface Props {
		track: Track;
		index: number;
		/** Tracks that this row's play button loads into the playlist. */
		playlist: Track[];
		shouldUseIndexAsTrackNumber?: boolean;
		shouldTogglePlayerDrawer?: boolean;
		shouldDisableRadioMode?: boolean;
		shouldHideArtist?: boolean;
	}

	let {
		track,
		index,
		playlist,
		shouldUseIndexAsTrackNumber = false,
		shouldTogglePlayerDrawer = true,
		shouldDisableRadioMode = false,
		shouldHideArtist = false
	}: Props = $props();

	const playerStore = getPlayerContext();
	const actionsStore = getPlayerActions();
	const actions = $derived($actionsStore);

	const currentTrack = $derived.by(() => {
		const { currentTrackIndex, playlist: nowPlaying } = $playerStore;
		return currentTrackIndex != null ? nowPlaying[currentTrackIndex] : null;
	});

	function formatTrackNumber(number: number) {
		return number < 10 ? `0${number}` : number;
	}

	function handlePlayButtonClick() {
		actions.loadPlaylist(playlist, index, {
			isRadio: shouldDisableRadioMode ? false : $playerStore.isRadio
		});

		if (shouldTogglePlayerDrawer) togglePlayerDrawer();
	}
</script>

<li
	class={cn('list-row md:items-center', currentTrack?.audioUrl === track.audioUrl && 'bg-gray-700')}
>
	<div class={cn('text-4xl font-thin tabular-nums opacity-30')}>
		{shouldUseIndexAsTrackNumber
			? formatTrackNumber(index + 1)
			: track.number
				? formatTrackNumber(track.number)
				: formatTrackNumber(index + 1)}
	</div>

	<div class="list-col-grow">
		<div class="flex items-center gap-2">
			<div class="flex grow flex-wrap items-center gap-2 py-1.5 md:py-0">
				{#if track.isCompilation && !shouldHideArtist}
					<span class="text-lg"
						><a
							href={resolve(`/artists/${track.artistSlug}`)}
							class="hover:link-secondary/80 link text-lg link-secondary">{track.artistName}</a
						></span
					>

					//
				{/if}

				<a
					href={resolve(`/artists/${track.artistSlug}/${track.albumSlug}/${track.slug}`)}
					class="hover:link-primary/80 link text-lg link-primary">{track.name}</a
				>
			</div>

			<button onclick={handlePlayButtonClick} class="btn btn-square btn-ghost">
				<span class="icon-[line-md--play-twotone]">Play</span>
			</button>
		</div>
	</div>
</li>
