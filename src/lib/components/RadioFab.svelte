<script lang="ts">
	import { getPlayerContext, getPlayerActions } from '$lib/context/player';
	import { togglePlayerDrawer } from '$lib/helpers/player';
	import { sampleRadioPlaylist, RADIO_PLAYLIST_SIZE } from '$lib/helpers';
	import { cn } from '$lib/helpers/tailwind';
	import type { Track } from '@fauxfetus/generator';
	import { version } from '$app/environment';

	const playerStore = getPlayerContext();
	const actionsStore = getPlayerActions();
	const actions = $derived($actionsStore);

	const { isPlaying } = $derived($playerStore);

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

	function handleClick() {
		togglePlayerDrawer();

		const { playlist } = $playerStore;

		// If no playlist is loaded yet, fetch tracks and start radio
		if (playlist.length === 0) {
			playerStore.update((s) => ({ ...s, isLoading: true }));
			fetch('/data/tracks.json')
				.then((r) => r.json())
				.then((tracks: Track[]) => {
					const radioPlaylist = sampleRadioPlaylist(tracks, RADIO_PLAYLIST_SIZE);
					playerStore.update((s) => ({ ...s, allTracks: tracks, isLoading: false }));
					actions.loadPlaylist(radioPlaylist, 0, { isRadio: true });
				});
			return;
		}

		// Playlist exists — toggle play/pause
		if (isPlaying) {
			actions.pause();
		} else {
			actions.play();
		}
	}
</script>

<button
	class={cn(
		'btn fixed right-6 bottom-6 z-9 btn-circle shadow-lg btn-primary',
		isPlaying && 'animate-pulse-slow'
	)}
	onclick={handleClick}
	onpointerdown={handlePointerDown}
	onpointerup={cancelLongpress}
	onpointerleave={cancelLongpress}
	onpointercancel={cancelLongpress}
	title="Toggle radio"
	aria-label="Toggle radio"
>
	<span
		class={cn(
			isPlaying ? 'icon-[line-md--volume-high-twotone]' : 'icon-[line-md--volume-low-twotone]'
		)}>Radio</span
	>
</button>
