import type { PlayerState } from '$lib/context/player';
import type { Track } from '@fauxfetus/generator';
import type { Writable } from 'svelte/store';
import { RADIO_PLAYLIST_SIZE, sampleRadioPlaylist } from '.';

export function incrementCurrentTrackIndex(store: Writable<PlayerState>): void {
	store.update((state) => {
		const { currentTrackIndex, playlist } = state;
		if (playlist.length === 0) return state;
		const next = currentTrackIndex == null ? 0 : (currentTrackIndex + 1) % playlist.length;
		return { ...state, currentTrackIndex: next };
	});
}

export function decrementCurrentTrackIndex(store: Writable<PlayerState>): void {
	store.update((state) => {
		const { currentTrackIndex, playlist } = state;
		if (playlist.length === 0) return state;
		const prev =
			currentTrackIndex == null
				? playlist.length - 1
				: (currentTrackIndex - 1 + playlist.length) % playlist.length;
		return { ...state, currentTrackIndex: prev };
	});
}

export async function fetchRadioPlaylist(): Promise<Track[]> {
	const playlist = await fetch('/data/tracks.json');
	return playlist.json();
}

export function togglePlayerDrawer() {
	document.getElementById('player-drawer-toggle')?.click();
}

export async function loadRadioPlaylist(store: Writable<PlayerState>): Promise<void> {
	const tracks = await fetchRadioPlaylist();

	store.update((state) => {
		return {
			...state,
			isRadio: true,
			isLoading: false,
			allTracks: tracks,
			playlist: sampleRadioPlaylist(tracks, RADIO_PLAYLIST_SIZE),
			currentTrackIndex: 0
		};
	});
}
