<script lang="ts">
	import { untrack } from 'svelte';
	import { getPlayerContext } from '$lib/context/player';
	import { incrementCurrentTrackIndex, loadRadioPlaylist } from '$lib/helpers/player';
	import {
		updateMediaSessionMetadata,
		updateMediaSessionPlaybackState,
		setupMediaSessionActionHandlers
	} from '$lib/helpers/media-session';
	import { shuffle } from '$lib/helpers';
	import TrackList from '$lib/components/TrackList.svelte';
	import CurrentTrackCard from './CurrentTrackCard.svelte';

	const playerStore = getPlayerContext();
	const { isLoading, isPlaying, isRadio, playlist, allTracks, currentTrackIndex } =
		$derived($playerStore);

	let audioElement: HTMLAudioElement | null = $state(null);

	const currentTrack = $derived.by(() => {
		const { currentTrackIndex, playlist } = $playerStore;
		return currentTrackIndex != null ? playlist[currentTrackIndex] : null;
	});

	const handleRadioButtonClick = () => {
		if (allTracks.length > 0) {
			playerStore.update((state) => ({
				...state,
				isRadio: true,
				playlist: shuffle(state.allTracks).slice(0, 49),
				currentTrackIndex: 0
			}));
		} else {
			playerStore.update((state) => ({
				...state,
				isLoading: true
			}));

			loadRadioPlaylist(playerStore);
		}
	};

	function handleAudioElementEnded() {
		const atEndOfPlaylist = playlist.length > 0 && currentTrackIndex === playlist.length - 1;

		if (!atEndOfPlaylist) {
			incrementCurrentTrackIndex(playerStore);
			return;
		}

		// If at the end of the playlist:
		// 1. reset the current track index
		// 2. refresh the playlist if in radio mode
		// 3. stop playing if not in radio mode
		playerStore.update((state) => ({
			...state,
			currentTrackIndex: 0,
			...(state.isRadio
				? { playlist: shuffle(state.allTracks).slice(0, 49) }
				: { isPlaying: false })
		}));
	}

	// Set up Media Session action handlers once we have an audio element.
	// These enable lock screen controls and, critically, tell Android that
	// the app is an active media session — which prevents the browser from
	// suspending audio when the screen turns off.
	$effect(() => {
		if (audioElement) {
			setupMediaSessionActionHandlers(playerStore, audioElement);
		}
	});

	// Update Media Session metadata and playback state whenever the
	// current track or play state changes.
	$effect(() => {
		if (currentTrack) {
			updateMediaSessionMetadata(currentTrack);
			updateMediaSessionPlaybackState(isPlaying);
		}
	});

	$effect(() => {
		void playlist;

		if (audioElement && currentTrack) {
			audioElement.load();

			if (untrack(() => isPlaying)) {
				audioElement.play().catch(() => {});
			}
		}
	});
</script>

<div class="absolute inset-4 flex flex-col gap-4 overflow-hidden">
	{#if isLoading}
		<div class="flex grow items-center justify-center">
			<span class="loading loading-xl loading-infinity"></span>
		</div>
	{:else}
		<CurrentTrackCard {audioElement} />
	{/if}

	{#if playlist}
		<div class="grow overflow-y-auto">
			<TrackList
				tracks={playlist}
				shouldTogglePlayerDrawer={false}
				shouldUseIndexAsTrackNumber={isRadio}
				shouldHideArtist={isRadio}
			/>
		</div>
	{/if}

	{#if !isRadio}
		<button class="btn self-stretch btn-neutral" onclick={handleRadioButtonClick}>
			<span class="icon-[line-md--arrow-small-left]"></span>
			Radio Mode
		</button>
	{/if}
</div>

{#if currentTrack}
	<audio
		controls
		class="hidden w-full"
		bind:this={audioElement}
		onended={handleAudioElementEnded}
		preload="none"
	>
		<source src={`/audio/${currentTrack.audioUrl}`} type="audio/mpeg" />
		Your browser does not support the audio element.
	</audio>
{/if}
