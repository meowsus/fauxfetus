<script lang="ts">
	import { untrack } from 'svelte';
	import { getPlayerContext } from '$lib/context/player';
	import { incrementCurrentTrackIndex, loadRadioPlaylist } from '$lib/helpers/player';
	import {
		updateMediaSessionMetadata,
		updateMediaSessionPlaybackState,
		setupMediaSessionActionHandlers
	} from '$lib/helpers/media-session';
	import { sampleRadioPlaylist, RADIO_PLAYLIST_SIZE } from '$lib/helpers';
	import type { Track } from '@fauxfetus/generator';
	import TrackList from '$lib/components/TrackList.svelte';
	import CurrentTrackCard from './CurrentTrackCard.svelte';

	const playerStore = getPlayerContext();
	const { isLoading, isPlaying, isRadio, playlist, allTracks } = $derived($playerStore);

	let audioElement: HTMLAudioElement | null = $state(null);

	const currentTrack = $derived.by(() => {
		const { currentTrackIndex, playlist } = $playerStore;
		return currentTrackIndex != null ? playlist[currentTrackIndex] : null;
	});

	/**
	 * Flag to prevent the reactive track-loading effect from double-loading
	 * a track that was already switched synchronously inside the 'ended'
	 * event handler or a Media Session action handler.
	 *
	 * Mobile browsers grant "transient activation" only during the
	 * synchronous execution of media events (ended, play, pause, etc.).
	 * If we defer audio.play() to a reactive effect or setTimeout, the
	 * browser will reject it as autoplay when the screen is off, causing
	 * playback to silently stop between tracks.
	 */
	let skipTrackLoad = false;

	/** Build the audio URL for a track. */
	function getAudioUrl(track: Track): string {
		return `/audio/${track.audioUrl}`;
	}

	/**
	 * Synchronously set the audio source and begin playback. This MUST be
	 * called within the synchronous call stack of a user-gesture or media
	 * event to preserve the browser's transient activation, which is required
	 * for play() to succeed without a user gesture on mobile.
	 */
	function playTrackSynchronously(track: Track): void {
		if (!audioElement) return;
		audioElement.src = getAudioUrl(track);
		audioElement.play().catch(() => {});
		skipTrackLoad = true;
	}

	const handleRadioButtonClick = () => {
		if (allTracks.length > 0) {
			playerStore.update((state) => ({
				...state,
				isRadio: true,
				playlist: sampleRadioPlaylist(state.allTracks, RADIO_PLAYLIST_SIZE),
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

	/**
	 * When a track finishes, synchronously advance to the next one.
	 *
	 * CRITICAL: Mobile browsers only allow play() without a user gesture
	 * during "transient activation" — a brief window that starts with the
	 * 'ended' event and expires as soon as JavaScript yields. If we defer
	 * play() to a reactive effect, setTimeout, or any async operation, the
	 * browser will reject it when the screen is off, causing playback to
	 * silently stop between tracks.
	 *
	 * Therefore, we MUST set the new src and call play() synchronously
	 * here, BEFORE updating the Svelte store (which triggers async
	 * reactive effects). See:
	 * - https://github.com/nickvdp/nickvdp/issues/557 (monochrome-music)
	 * - https://bugs.webkit.org/show_bug.cgi?id=173332
	 * - https://stackoverflow.com/questions/75279290
	 */
	function handleAudioElementEnded() {
		const { currentTrackIndex, playlist, isRadio, allTracks } = $playerStore;
		const atEndOfPlaylist = playlist.length > 0 && currentTrackIndex === playlist.length - 1;

		if (!atEndOfPlaylist) {
			const nextIndex = currentTrackIndex == null ? 0 : currentTrackIndex + 1;
			const nextTrack = playlist[nextIndex];

			if (nextTrack) {
				playTrackSynchronously(nextTrack);
			}

			incrementCurrentTrackIndex(playerStore);
			return;
		}

		// At the end of the playlist:
		if (isRadio) {
			const newPlaylist = sampleRadioPlaylist(allTracks, RADIO_PLAYLIST_SIZE);
			const nextTrack = newPlaylist[0];

			if (nextTrack) {
				playTrackSynchronously(nextTrack);
			}

			playerStore.update((state) => ({
				...state,
				currentTrackIndex: 0,
				playlist: newPlaylist
			}));
		} else {
			audioElement?.pause();
			playerStore.update((state) => ({ ...state, isPlaying: false }));
			updateMediaSessionPlaybackState(false);
		}
	}

	// Set up Media Session action handlers.
	// These enable lock screen controls and MUST also switch tracks
	// synchronously to preserve transient activation on mobile.
	$effect(() => {
		if (audioElement) {
			setupMediaSessionActionHandlers(playerStore, audioElement, playTrackSynchronously);
		}
	});

	// Update Media Session metadata whenever the current track or play
	// state changes.
	$effect(() => {
		if (currentTrack) {
			updateMediaSessionMetadata(currentTrack);
			updateMediaSessionPlaybackState(isPlaying);
		}
	});

	// Load a track when currentTrack changes from a user-initiated action
	// (clicking a track, pressing play, initial load, etc.). This effect
	// is SKIPPED when we've already handled the switch synchronously via
	// playTrackSynchronously() to prevent double-loading.
	$effect(() => {
		void currentTrack;

		if (skipTrackLoad) {
			skipTrackLoad = false;
			return;
		}

		if (audioElement && currentTrack) {
			audioElement.src = getAudioUrl(currentTrack);

			if (untrack(() => isPlaying)) {
				audioElement.play().catch(() => {});
			}
		}
	});

	// Preload the next track when the current one is near its end, so
	// the browser has the audio data cached before the 'ended' event
	// fires. This is especially important on mobile where the network
	// may be throttled when the screen is off.
	let nextTrackPreloaded: string | null = null;

	function handleTimeUpdate() {
		if (!audioElement || !audioElement.duration) return;

		const remaining = audioElement.duration - audioElement.currentTime;
		const nearEnd =
			remaining < 20 ||
			(audioElement.duration > 0 && audioElement.currentTime / audioElement.duration > 0.8);

		if (nearEnd) {
			const { currentTrackIndex, playlist } = $playerStore;
			const nextIndex = currentTrackIndex == null ? 0 : currentTrackIndex + 1;

			if (nextIndex < playlist.length) {
				const nextTrack = playlist[nextIndex];
				const url = getAudioUrl(nextTrack);

				if (nextTrackPreloaded !== url) {
					nextTrackPreloaded = url;
					fetch(url).catch(() => {});
				}
			}
		}
	}
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

<!-- Always render the audio element in the DOM. Conditionally removing it
     destroys the browser's media session context and loses buffered data,
     which prevents seamless track transitions on mobile. -->
<audio
	class="hidden w-full"
	bind:this={audioElement}
	onended={handleAudioElementEnded}
	ontimeupdate={handleTimeUpdate}
	preload="auto"
></audio>
