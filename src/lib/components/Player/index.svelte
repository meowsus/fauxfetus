<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { getPlayerContext, getPlayerActions } from '$lib/context/player';
	import type { PlayerActions } from '$lib/context/player';
	import { sampleRadioPlaylist, RADIO_PLAYLIST_SIZE } from '$lib/helpers';
	import {
		updateMediaSessionMetadata,
		updateMediaSessionPlaybackState
	} from '$lib/helpers/media-session';
	import type { Track } from '@fauxfetus/data-generator';
	import type { Gapless5 } from '@regosen/gapless-5';
	import TrackList from '$lib/components/TrackList.svelte';
	import CurrentTrackCard from './CurrentTrackCard.svelte';

	const playerStore = getPlayerContext();
	const playerActionsStore = getPlayerActions();
	const { isLoading, isRadio, playlist, allTracks } = $derived($playerStore);

	let player: Gapless5 | null = $state(null);

	// Fine-grained local $state for high-frequency progress data.
	// Kept OUT of the shared Writable store so that 37×/sec ticks from
	// Gapless5 only re-render CurrentTrackProgress — not every store
	// subscriber like CurrentTrackControls, CurrentTrackCard, etc.
	let position = $state(0);
	let duration = $state(0);

	/**
	 * Map from audio URL path (as known by Gapless5) back to our Track object.
	 * Keeps our playlist data in sync with Gapless5's internal track list.
	 */
	let trackMap = new SvelteMap<string, Track>();

	const currentTrack = $derived.by(() => {
		const { currentTrackIndex, playlist } = $playerStore;
		return currentTrackIndex != null ? playlist[currentTrackIndex] : null;
	});

	/** Build the audio URL for a track — the path Gapless5 uses. */
	function getAudioUrl(track: Track): string {
		return `/audio/${track.audioUrl}`;
	}

	// ── PlayerActions implementation ────────────────────────────────────

	/**
	 * Replace Gapless5's playlist with new tracks and jump to startIndex.
	 * This is the single entry point for changing what's playing.
	 */
	function loadPlaylist(
		tracks: Track[],
		startIndex: number,
		options: { isRadio?: boolean } = {}
	): void {
		if (!player) return;

		// Stop current playback before swapping tracks
		player.stop();
		player.removeAllTracks();

		// Rebuild track map
		trackMap.clear();
		for (const track of tracks) {
			const url = getAudioUrl(track);
			trackMap.set(url, track);
			player.addTrack(url);
		}

		// Update store
		playerStore.update((state) => ({
			...state,
			isPlaying: false,
			isRadio: options.isRadio ?? state.isRadio,
			playlist: tracks,
			currentTrackIndex: startIndex
		}));

		// Reset progress state
		position = 0;
		duration = 0;

		// Jump to the requested track and start playback
		player.gotoTrack(startIndex, true);
	}

	const actions: PlayerActions = {
		loadPlaylist,
		play: () => player?.play(),
		pause: () => player?.pause(),
		togglePlay: () => player?.playpause(),
		prev: () => player?.prevtrack(),
		next: () => player?.next(null, null, null)
	};

	// ── Gapless5 callbacks → store sync ────────────────────────────────

	function handlePlay(trackPath: string): void {
		const track = trackMap.get(trackPath);
		const index = track ? $playerStore.playlist.indexOf(track) : (player?.getIndex() ?? -1);

		playerStore.update((state) => ({
			...state,
			isPlaying: true,
			currentTrackIndex: index >= 0 ? index : state.currentTrackIndex
		}));
		updateMediaSessionPlaybackState(true);
	}

	function handlePause(): void {
		playerStore.update((state) => ({ ...state, isPlaying: false }));
		updateMediaSessionPlaybackState(false);
	}

	function handleStop(): void {
		playerStore.update((state) => ({ ...state, isPlaying: false }));
		updateMediaSessionPlaybackState(false);
	}

	function handleNext(fromPath: string): void {
		const fromTrack = trackMap.get(fromPath);
		const fromIndex = fromTrack
			? $playerStore.playlist.indexOf(fromTrack)
			: (player?.getIndex() ?? -1);
		const nextIndex = fromIndex >= 0 ? fromIndex + 1 : -1;

		// The next track is playing, advance our index
		if (nextIndex >= 0 && nextIndex < $playerStore.playlist.length) {
			playerStore.update((state) => ({ ...state, currentTrackIndex: nextIndex }));
		}
	}

	function handlePrev(_fromPath: string, toPath: string): void {
		const toTrack = trackMap.get(toPath);
		const toIndex = toTrack ? $playerStore.playlist.indexOf(toTrack) : (player?.getIndex() ?? -1);

		if (toIndex >= 0) {
			playerStore.update((state) => ({ ...state, currentTrackIndex: toIndex }));
		}
	}

	// ── High-frequency time updates (rAF-batched) ───────────────────────

	/** Pending time-update payload from Gapless5, awaiting the next paint. */
	let pendingTimeMs = -1;
	let pendingTrackIndex = -1;
	let rafId: number | null = null;

	function handleTimeUpdate(currentTimeMs: number, currentTrackIndex: number): void {
		pendingTimeMs = currentTimeMs;
		pendingTrackIndex = currentTrackIndex;
		if (rafId === null) {
			rafId = requestAnimationFrame(flushTimeUpdate);
		}
	}

	function flushTimeUpdate(): void {
		rafId = null;

		// Update fine-grained local state (only re-renders consumers of these)
		position = pendingTimeMs;
		duration = player?.currentLength() ?? 0;

		// Sync track index into the shared store, but only when it actually changed
		if (pendingTrackIndex >= 0 && pendingTrackIndex !== $playerStore.currentTrackIndex) {
			playerStore.update((state) => ({ ...state, currentTrackIndex: pendingTrackIndex }));
		}
	}

	function handleFinishedAll(): void {
		const { isRadio, allTracks } = $playerStore;

		if (isRadio && allTracks.length > 0) {
			// Auto-continue radio: generate fresh playlist and keep playing
			const newPlaylist = sampleRadioPlaylist(allTracks, RADIO_PLAYLIST_SIZE);
			loadPlaylist(newPlaylist, 0, { isRadio: true });
		} else {
			playerStore.update((state) => ({ ...state, isPlaying: false }));
			updateMediaSessionPlaybackState(false);
		}
	}

	// ── Media Session setup ────────────────────────────────────────────

	function setupMediaSession(): void {
		if (!('mediaSession' in navigator) || !player) return;

		navigator.mediaSession.setActionHandler('play', () => {
			player!.play();
		});

		navigator.mediaSession.setActionHandler('pause', () => {
			player!.pause();
		});

		navigator.mediaSession.setActionHandler('previoustrack', () => {
			player!.prevtrack();
		});

		navigator.mediaSession.setActionHandler('nexttrack', () => {
			player!.next(null, null, null);
		});
	}

	// ── Lifecycle ──────────────────────────────────────────────────────

	onMount(() => {
		import('@regosen/gapless-5').then(({ Gapless5 }) => {
			player = new Gapless5({
				// WebAudio (AudioContext/AudioBufferSourceNode) is suspended by mobile
				// browsers when the screen is off, causing clicks/pops and eventual
				// silence.  The reference demo uses useWebAudio: false for seamless
				// album playback — pure HTML5 <audio> elements are managed by the
				// OS media pipeline and continue playing correctly with screen off.
				useWebAudio: false,
				loop: false,
				startingTrack: 0,
				shuffle: false,
				shuffleButton: false,
				loadLimit: 2,
				logLevel: 2 // Info
			});

			player.onplay = handlePlay;
			player.onpause = handlePause;
			player.onstop = handleStop;
			player.onnext = handleNext;
			player.onprev = handlePrev;
			player.ontimeupdate = handleTimeUpdate;
			player.onfinishedall = handleFinishedAll;

			// Replace the no-op defaults with real Gapless5-bound actions
			playerActionsStore.set(actions);

			setupMediaSession();
		});

		return () => {
			if (rafId !== null) cancelAnimationFrame(rafId);
			player?.stop();
			player?.removeAllTracks();
		};
	});

	// Sync Media Session metadata when current track changes
	$effect(() => {
		if (currentTrack) {
			updateMediaSessionMetadata(currentTrack);
		}
	});

	// ── UI event handlers ──────────────────────────────────────────────

	const handleRadioButtonClick = () => {
		if (allTracks.length > 0) {
			const newPlaylist = sampleRadioPlaylist(allTracks, RADIO_PLAYLIST_SIZE);
			loadPlaylist(newPlaylist, 0, { isRadio: true });
		} else {
			playerStore.update((state) => ({ ...state, isLoading: true }));
			fetch('/data/tracks.json')
				.then((r) => r.json())
				.then((tracks: Track[]) => {
					playerStore.update((state) => ({ ...state, allTracks: tracks }));
					const newPlaylist = sampleRadioPlaylist(tracks, RADIO_PLAYLIST_SIZE);
					loadPlaylist(newPlaylist, 0, { isRadio: true });
				})
				.finally(() => {
					playerStore.update((state) => ({ ...state, isLoading: false }));
				});
		}
	};
</script>

<div class="absolute inset-4 flex flex-col gap-4 overflow-hidden">
	{#if isLoading}
		<div class="flex grow items-center justify-center">
			<span class="loading loading-xl loading-infinity"></span>
		</div>
	{:else}
		<CurrentTrackCard {position} {duration} />
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
