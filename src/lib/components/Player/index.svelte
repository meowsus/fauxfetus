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
	import { resolve } from '$app/paths';
	import type { Gapless5 } from '@regosen/gapless-5';

	const playerStore = getPlayerContext();
	const playerActionsStore = getPlayerActions();
	const { isPlaying } = $derived($playerStore);

	let player: Gapless5 | null = $state(null);
	let queueOpen = $state(false);

	// Fine-grained local $state for high-frequency progress data.
	// Kept OUT of the shared Writable store so that 37×/sec ticks from
	// Gapless5 only re-render the player pill — not every store subscriber.
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

	/** Queue = everything after the playing track (pill panel list). */
	const queue = $derived.by(() => {
		const { playlist, currentTrackIndex } = $playerStore;
		return currentTrackIndex != null ? playlist.slice(currentTrackIndex + 1) : [];
	});

	/** Chord-line progress (0–100) feeding the pill's gradient hairline —
	 * the one motion moment in this design, and it tracks real audio time. */
	const progress = $derived(
		duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0
	);

	function formatTime(ms: number): string {
		const total = Math.floor(ms / 1000);
		const m = Math.floor(total / 60);
		return `${m}:${String(total % 60).padStart(2, '0')}`;
	}

	/* Real data is law: until the audio element reports a duration, the time
	 * readout shows position only — no invented total. */
	const timeText = $derived(
		duration > 0 ? `${formatTime(position)} / ${formatTime(duration)}` : formatTime(position)
	);

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
		next: () => player?.next(null, null, null),
		// onplay syncs the store index, so a bare gotoTrack is enough
		jumpTo: (index: number) => player?.gotoTrack(index, true)
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
	// Radio entry points are startRadio() in $lib/helpers, invoked from the
	// navbar Radio button; the in-player "Radio Mode" button was removed
	// in the IA rework (one global trigger, available on every page).
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') queueOpen = false;
	}}
/>

{#if currentTrack}
	<div class="dock">
		{#if queueOpen}
			<div class="queue" id="player-queue" aria-label="Up next">
				<p class="q-head cap">Up next&nbsp;<span class="tnum">{queue.length}</span></p>
				{#if queue.length === 0}
					<p class="q-note">
						{$playerStore.isRadio
							? 'Queue empty — a fresh set follows this track.'
							: 'Last track of the set.'}
					</p>
				{:else}
					<ol>
						{#each queue as qTrack, i (getAudioUrl(qTrack))}
							<li>
								<button
									type="button"
									onclick={() =>
										$playerActionsStore.jumpTo($playerStore.playlist.length - queue.length + i)}
								>
									<span class="no tnum">{i + 1}</span>
									<span class="qmain">
										<span class="qt">{qTrack.name}</span>
										<span class="qx">{qTrack.artistName} · {qTrack.albumName}</span>
									</span>
								</button>
							</li>
						{/each}
					</ol>
				{/if}
			</div>
		{/if}
		<aside class="player" aria-label="Now playing" style="--p: {progress}%">
			<p class="track">
				<a
					href={resolve(
						`/artists/${currentTrack.artistSlug}/${currentTrack.albumSlug}/${currentTrack.slug}`
					)}>{currentTrack.name}</a
				>
				<span> — {currentTrack.artistName} · {currentTrack.albumName}</span>
			</p>

			<span class="time tnum">{timeText}</span>

			<div class="glyphs">
				<button
					type="button"
					class="glyph chev"
					aria-label={queueOpen ? 'Hide queue' : 'Show queue'}
					aria-expanded={queueOpen}
					aria-controls="player-queue"
					onclick={() => (queueOpen = !queueOpen)}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"><path d="m6 14 6-6 6 6" /></svg
					>
				</button>
				<button
					type="button"
					class="glyph"
					aria-label="Previous track"
					onclick={() => $playerActionsStore.prev()}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"><path d="m13 6-5 6 5 6M19 6l-5 6 5 6" /></svg
					>
				</button>
				<button
					type="button"
					class="glyph play"
					aria-label={isPlaying ? 'Pause' : 'Play'}
					onclick={() => $playerActionsStore.togglePlay()}
				>
					{#if isPlaying}
						<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
							><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z" /></svg
						>
					{:else}
						<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
							><path d="M8 5.4v13.2L19.5 12z" /></svg
						>
					{/if}
				</button>
				<button
					type="button"
					class="glyph"
					aria-label="Next track"
					onclick={() => $playerActionsStore.next()}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"><path d="m11 6 5 6-5 6M5 6l5 6-5 6" /></svg
					>
				</button>
			</div>
		</aside>
	</div>
{/if}

<style>
	/* ── floating pill player — the one piece of glass in the design ── */
	.dock {
		position: fixed;
		z-index: 10;
		bottom: calc(1rem + env(safe-area-inset-bottom));
		inset-inline: 0;
		margin-inline: auto;
		width: min(calc(100% - 2.5rem), 33rem);
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.player {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.7rem;
		background: rgb(19 20 27 / 0.93);
		backdrop-filter: blur(18px);
		border: 1px solid rgb(236 233 244 / 0.24);
		border-radius: 999px;
		padding: 0.6rem 0.7rem 0.6rem 1.1rem;
		box-shadow: 0 12px 32px rgb(0 0 0 / 0.5);
	}

	/* the chord line: real playback progress, not a decorative gradient */
	.player::before {
		content: '';
		position: absolute;
		top: -1px;
		left: 12%;
		right: 12%;
		height: 1px;
		background: linear-gradient(
			to right,
			var(--violet) var(--p, 0%),
			rgba(236, 233, 244, 0.22) var(--p, 0%)
		);
	}

	.player .track {
		flex: 1;
		min-width: 0;
		font-family: 'Instrument Serif', Georgia, serif;
		font-style: italic;
		font-size: 1.15rem;
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.player .track span {
		font-family: 'Space Grotesk', system-ui, sans-serif;
		font-style: normal;
		font-weight: 300;
		color: var(--dim);
		white-space: nowrap;
	}

	.player .time {
		color: var(--dim);
		font-weight: 300;
		flex: none;
		font-variant-numeric: tabular-nums lining-nums;
	}

	.player .glyphs {
		display: flex;
		align-items: center;
		gap: 0.15rem;
		flex: none;
	}

	.glyph {
		width: 42px;
		height: 42px;
		display: grid;
		place-items: center;
		color: var(--dim);
		border-radius: 50%;
	}

	.glyph:hover {
		color: var(--ink);
	}

	.glyph.play {
		width: 48px;
		height: 48px;
		background: var(--violet);
		color: #0e0f13;
	}

	.glyph.chev svg {
		transition: transform 0.18s ease;
	}

	.glyph.chev[aria-expanded='true'] svg {
		transform: rotate(180deg);
	}

	.glyph.play:hover {
		background: #c0b4ff;
		color: #0e0f13;
	}

	/* ── queue panel: stacked dock, right-aligned drawer over the pill ── */
	.queue {
		align-self: flex-end;
		width: min(100%, 22rem);
		max-height: min(17.5rem, 44vh);
		overflow-y: auto;
		overscroll-behavior: contain;
		background: rgb(19 20 27 / 0.93);
		backdrop-filter: blur(18px);
		border: 1px solid rgb(236 233 244 / 0.24);
		border-radius: 0.9rem;
		box-shadow: 0 12px 32px rgb(0 0 0 / 0.5);
		padding: 0.65rem 0 0.4rem;
		animation: queue-rise 0.18s ease-out;
	}

	@keyframes queue-rise {
		from {
			opacity: 0;
			transform: translateY(0.4rem);
		}
	}

	.q-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		padding: 0 1rem 0.45rem;
		color: var(--dim);
		border-bottom: 1px solid var(--hair);
		margin-bottom: 0.2rem;
	}

	.queue ol {
		list-style: none;
	}

	.queue li button {
		display: grid;
		grid-template-columns: 1.7rem 1fr;
		column-gap: 0.55rem;
		align-items: baseline;
		width: 100%;
		min-height: 44px;
		text-align: left;
		padding: 0.35rem 1rem 0.35rem 0.8rem;
		border-radius: 0.55rem;
		color: var(--ink);
	}

	.queue li .no {
		grid-row: span 2;
		align-self: center;
		color: var(--dim);
		font-weight: 300;
		font-size: 0.85rem;
	}

	.queue li .qt {
		grid-column: 2;
		line-height: 1.3;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.queue li .qx {
		grid-column: 2;
		font-weight: 300;
		font-size: 0.8rem;
		color: var(--dim);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* invert signature, same as the nav */
	.queue li button:hover,
	.queue li button:focus-visible {
		background: var(--violet);
		color: #0e0f13;
	}

	.queue li button:hover .no,
	.queue li button:hover .qx,
	.queue li button:focus-visible .no,
	.queue li button:focus-visible .qx {
		color: rgb(14 15 19 / 0.6);
	}

	.q-note {
		padding: 0.55rem 1rem 0.6rem;
		font-weight: 300;
		font-size: 0.95rem;
		color: var(--dim);
	}

	@media (prefers-reduced-motion: reduce) {
		.queue {
			animation: none;
		}

		.glyph.chev svg {
			transition: none;
		}
	}

	@media (min-width: 48em) {
		.dock {
			width: min(calc(100% - 4rem), 36rem);
		}
	}

	@media (min-width: 64em) {
		.dock {
			width: min(calc(100% - 6rem), 46rem);
			bottom: calc(1.4rem + env(safe-area-inset-bottom));
		}

		.player .track {
			font-size: 1.3rem;
		}
	}
</style>
