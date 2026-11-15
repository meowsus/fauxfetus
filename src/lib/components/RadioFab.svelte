<script lang="ts">
	import { getPlayerContext, getPlayerActions } from '$lib/context/player';
	import { sampleRadioPlaylist, RADIO_PLAYLIST_SIZE } from '$lib/helpers';
	import type { Track } from '@fauxfetus/data-generator';
	import { version } from '$app/environment';

	const playerStore = getPlayerContext();
	const actionsStore = getPlayerActions();
	const actions = $derived($actionsStore);

	const { playlist } = $derived($playerStore);

	let longpressTimer: ReturnType<typeof setTimeout> | null = null;

	function handlePointerDown() {
		longpressTimer = setTimeout(() => {
			alert(`fauxfetus v${version} (${__GIT_SHA__})`);
		}, 500);
	}

	function cancelLongpress() {
		if (longpressTimer !== null) {
			clearTimeout(longpressTimer);
			longpressTimer = null;
		}
	}

	/**
	 * This button starts Radio Mode — it intentionally does NOT
	 * pause/resume audio. Play/pause lives on the player's own
	 * controls (CurrentTrackControls).
	 *
	 * The one exception is the very first tap, when no playlist is loaded
	 * yet — in that case we fetch tracks and start the radio so the player
	 * has something to show.
	 */
	function handleClick() {
		if (playlist.length === 0) {
			playerStore.update((s) => ({ ...s, isLoading: true }));
			fetch('/data/tracks.json')
				.then((r) => {
					if (!r.ok) throw new Error(`HTTP ${r.status}`);
					return r.json();
				})
				.then((tracks: Track[]) => {
					const radioPlaylist = sampleRadioPlaylist(tracks, RADIO_PLAYLIST_SIZE);
					playerStore.update((s) => ({ ...s, allTracks: tracks }));
					actions.loadPlaylist(radioPlaylist, 0, { isRadio: true });
				})
				.catch((err) => {
					console.error('Radio failed to start:', err);
				})
				.finally(() => {
					playerStore.update((s) => ({ ...s, isLoading: false }));
				});
		}
	}
</script>

<button
	type="button"
	onclick={handleClick}
	onpointerdown={handlePointerDown}
	onpointerup={cancelLongpress}
	onpointerleave={cancelLongpress}
	onpointercancel={cancelLongpress}
	title="Start radio"
>
	Radio
</button>
