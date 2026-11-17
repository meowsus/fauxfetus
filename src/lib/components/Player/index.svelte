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

	/** Queue = the full playlist; the playing row is marked in place, so
	 * advancing a track moves one badge instead of reflowing the list. */
	const playlist = $derived($playerStore.playlist);
	const currentIndex = $derived($playerStore.currentTrackIndex);

	/** The queue's scroller: anchor for the scroll-current-into-view effect. */
	let scrollEl: HTMLDivElement | null = $state(null);
	/** The plate itself (queue + bar): the click-out boundary for the
	 * queue drawer — the bar's controls stay inside it, so playing or
	 * scrolling the pill never shuts the list. */
	let plateEl: HTMLElement | null = $state(null);

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

	// Park the queue on open and on every track change: the next track
	// becomes the top row of the list, a little air under the head's
	// border. The target is assigned in the scroller's own content space —
	// (row viewport top − scroller viewport top) + scrollTop is the same
	// number whether the drawer is a sliver mid-slide or fully open — so
	// it lands exactly at any box state. How it moves there depends on
	// the trigger: opening the drawer snaps instantly (orientation before
	// the slide reveals it); a track ADVANCE glides — ease-out, ~200ms
	// for one row, capped for far jumps; any other rerun re-asserts the
	// park silently; and the user's own wheel/touch cancels a glide
	// rather than fighting the hand.
	let parkPrevOpen = false;
	let parkPrevIdx = -1;

	$effect(() => {
		const q = scrollEl;
		if (!q || !queueOpen) {
			// closed (or not mounted): the next open must classify as an
			// open, not resume mid-list as an advance
			parkPrevOpen = false;
			parkPrevIdx = currentIndex ?? -1;
			return;
		}
		const idx = currentIndex;
		if (idx == null || idx < 0 || idx >= playlist.length) return;

		// target: the fresh set starts at the top (row 1 under the head);
		// otherwise the track after the playing one — the last track rows
		// itself up. Exactly at the row's top edge, no sliver of the
		// playing row above; the air under the head is the head's margin
		// plus the row's own padding, not scroll math.
		let target = 0;
		if (idx > 0) {
			const rows = q.querySelectorAll('ol > li');
			const row = rows[Math.min(idx + 1, playlist.length - 1)] as HTMLElement | undefined;
			if (!row) return;
			const rowTop = row.getBoundingClientRect().top - q.getBoundingClientRect().top + q.scrollTop;
			target = Math.max(0, rowTop);
		}

		const opened = !parkPrevOpen;
		const advanced = !opened && idx !== parkPrevIdx;
		parkPrevOpen = true;
		parkPrevIdx = idx;

		// instant when opening, on unrelated reruns, and under reduced motion
		if (!advanced || matchMedia('(prefers-reduced-motion: reduce)').matches) {
			q.scrollTop = target;
			return;
		}

		// glide: ease-out cubic, duration scaled by distance (one row ≈
		// 200ms) and capped for far jumps
		const from = q.scrollTop;
		const delta = target - from;
		if (Math.abs(delta) < 1) return;
		const dur = Math.min(400, 180 + Math.abs(delta) * 0.25);
		const t0 = performance.now();
		let raf = 0;
		const stop = () => cancelAnimationFrame(raf);
		const step = (now: number) => {
			const t = Math.min(1, (now - t0) / dur);
			q.scrollTop = from + delta * (1 - Math.pow(1 - t, 3)); // ease-out cubic
			if (t < 1) raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
		q.addEventListener('wheel', stop, { passive: true });
		q.addEventListener('touchstart', stop, { passive: true });
		return () => {
			cancelAnimationFrame(raf);
			q.removeEventListener('wheel', stop);
			q.removeEventListener('touchstart', stop);
		};
	});

	// ── UI event handlers ──────────────────────────────────────────────
	/** Click-out dismissal: a pointerdown that lands outside the plate
	 * closes the queue drawer (any pointer, so a tap clears it on touch
	 * too). Inside the plate the event is ignored — the drawer only
	 * yields to hands that were never in it. */
	function handleDocumentPointerdown(event: PointerEvent): void {
		if (!queueOpen) return;
		if (plateEl && event.target instanceof Node && plateEl.contains(event.target)) return;
		queueOpen = false;
	}

	// Radio entry points are startRadio() in $lib/helpers, invoked from the
	// navbar Radio button; the in-player "Radio Mode" button was removed
	// in the IA rework (one global trigger, available on every page).
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') queueOpen = false;
	}}
/>

<svelte:document onpointerdown={handleDocumentPointerdown} />

{#if currentTrack}
	<div class="dock">
		<aside
			class="player"
			aria-label="Now playing"
			class:expanded={queueOpen}
			style="--p: {progress}%"
			bind:this={plateEl}
		>
			<div class="queue-slot">
				<div class="queue" id="player-queue" role="region" aria-label="Queue">
					<p class="q-head cap">
						Queue&nbsp;<span class="tnum">{(currentIndex ?? 0) + 1} / {playlist.length}</span>
					</p>
					<div class="queue-scroll" bind:this={scrollEl}>
						<ol>
							{#each playlist as qTrack, i (getAudioUrl(qTrack))}
								{@const current = i === currentIndex}
								{@const upcoming = i === (currentIndex ?? -1) + 1}
								<li class:current class:past={!current && i < (currentIndex ?? -1)}>
									<button
										type="button"
										aria-current={current ? 'true' : undefined}
										onclick={() => $playerActionsStore.jumpTo(i)}
									>
										<span class="no tnum">{i + 1}</span>
										<span class="qmain">
											<span class="qt">{qTrack.name}</span>
											<span class="qx">{qTrack.artistName} · {qTrack.albumName}</span>
										</span>
										{#if current}
											<span class="cap now">playing</span>
										{:else if upcoming}
											<span class="cap next">next up</span>
										{/if}
									</button>
								</li>
							{/each}
						</ol>
					</div>
				</div>
			</div>
			<div class="bar">
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
	}

	/* The pill is the whole player: collapsed it is the familiar capsule;
	 * expanded it grows upward into a plate with the queue riding inside
	 * and the bar row holding the capsule bottom in place. */
	.player {
		display: flex;
		flex-direction: column;
		background: rgb(19 20 27 / 0.93);
		backdrop-filter: blur(18px);
		border: 1px solid rgb(236 233 244 / 0.24);
		/* one radius for every corner and every state — the bar half-height
		 * (2.16rem = (48px glyph + 2 × .6rem padding + 2px border) / 2):
		 * collapsed it is the capsule curve itself, expanded it matches the
		 * plate's bottom, and because no value ever changes, no corner
		 * morphs while the drawer slides */
		border-radius: 2.16rem;
		box-shadow: 0 12px 32px rgb(0 0 0 / 0.5);
	}

	.bar {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.6rem 0.7rem 0.6rem 1.1rem;
	}

	/* the chord line: real playback progress, not a decorative gradient —
	 * drawn on the bar's top edge, i.e. the queue seam when expanded */
	/* progress: the plate's BOTTOM border is the indicator. Anchored to
	 * the plate itself — not the bar's top edge — it reads at the same
	 * place collapsed and expanded; the old seam chord jumped when the
	 * queue opened because its anchor moved with the state. The plate's
	 * ends are curves, so the chord spans between the 2.16rem arcs and
	 * terminates at the tangents. */
	.player::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 2.16rem;
		right: 2.16rem;
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

	/* ── queue region: an in-flow section of the expanded plate ──
	 * the drawer slides up out of the pill: grid 0fr ↔ 1fr animates the
	 * region's real height (content of any length, no max-height wait),
	 * the clip keeps it growing out of the seam, and the bar row — the
	 * pill the user already knows — never moves or reshapes */
	.queue-slot {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows 0.18s cubic-bezier(0.33, 1, 0.68, 1);
	}

	.player.expanded .queue-slot {
		grid-template-rows: 1fr;
	}

	.queue-slot .queue {
		min-height: 0;
		/* out of tab order while collapsed; the delay keeps it visible
		 * through the close slide, then hides it */
		visibility: hidden;
		transition: visibility 0s linear 0.18s;
	}

	.player.expanded .queue-slot .queue {
		visibility: visible;
		transition-delay: 0s;
	}

	.queue {
		display: flex;
		flex-direction: column;
		max-height: min(20rem, 46vh);
		/* clips the drawer mid-slide; the head stays pinned above the port */
		overflow: hidden;
		/* spacing lives on the head/list, not here: under the 0fr slide the
		 * grid item is clamped by min-height: 0, but padding and border live
		 * outside that clamp — 18px of padding kept the collapsed pill ~20px
		 * too tall, flattening its capsule ends into a ledge */
		border-bottom: 1px solid var(--hair);
	}

	.queue-scroll {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
		overscroll-behavior: contain;
		/* browser chrome in the Mothwing voice — a dim thumb on glass */
		scrollbar-width: thin;
		scrollbar-color: rgb(236 233 244 / 0.3) transparent;
		/* the scrollport starts below the fixed head, inside the straight
		 * glass — the scrollbar and its arrow buttons never cross the plate's
		 * top curve */
	}

	.q-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		padding: 0.75rem 1.1rem 0.45rem;
		color: var(--dim);
		border-bottom: 1px solid var(--hair);
		/* the park lands the next row's top edge at the port top, so this
		 * margin is all the air between the head's border and its number */
		margin-bottom: 0.5rem;
	}

	.queue ol {
		list-style: none;
		padding: 0 0 0.4rem;
	}

	.queue li button {
		display: grid;
		/* minmax(0, 1fr): plain 1fr floors the second column at min-content,
		 * fighting the ellipsis and leaking a horizontal scrollbar */
		grid-template-columns: 1.7rem minmax(0, 1fr) auto;
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
		display: block;
		grid-column: 2;
		line-height: 1.3;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.queue li .qx {
		display: block;
		grid-column: 2;
		font-weight: 300;
		font-size: 0.8rem;
		color: var(--dim);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* the playing row: violet number + the caps badge at the title line's
	 * end — the same li.playing / .now grammar as the album tracklists */
	.queue li .now {
		grid-column: 3;
		grid-row: 1;
		align-self: center;
		color: var(--violet);
		white-space: nowrap;
		padding-left: 0.7rem;
	}

	/* the row that follows: same shelf on the title line, quiet dim caps */
	.queue li .next {
		grid-column: 3;
		grid-row: 1;
		align-self: center;
		color: var(--dim);
		white-space: nowrap;
		padding-left: 0.7rem;
	}

	.queue li.current .no {
		color: var(--violet);
	}

	/* already-played rows keep their place in the set, quietly */
	.queue li.past .qt {
		color: var(--dim);
	}

	/* invert signature, same as the nav */
	.queue li button:hover,
	.queue li button:focus-visible {
		background: var(--violet);
		color: #0e0f13;
	}

	.queue li button:hover .no,
	.queue li button:hover .now,
	.queue li button:hover .next,
	.queue li button:hover .qx,
	.queue li button:focus-visible .no,
	.queue li button:focus-visible .now,
	.queue li button:focus-visible .next,
	.queue li button:focus-visible .qx {
		color: rgb(14 15 19 / 0.6);
	}

	@media (prefers-reduced-motion: reduce) {
		.queue-slot,
		.queue,
		.player {
			transition: none;
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
