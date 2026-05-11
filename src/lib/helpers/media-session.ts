import type { PlayerState } from '$lib/context/player';
import type { Track } from '@fauxfetus/generator';
import type { Writable } from 'svelte/store';
import { decrementCurrentTrackIndex, incrementCurrentTrackIndex } from './player';

const APP_ICON_ARTWORK: MediaImage[] = [
	{ src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
	{ src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
];

export function updateMediaSessionMetadata(track: Track): void {
	if (!('mediaSession' in navigator)) return;

	navigator.mediaSession.metadata = new MediaMetadata({
		title: track.name,
		artist: track.artistName,
		album: track.albumName,
		artwork: APP_ICON_ARTWORK
	});
}

export function updateMediaSessionPlaybackState(isPlaying: boolean): void {
	if (!('mediaSession' in navigator)) return;

	navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
}

export function setupMediaSessionActionHandlers(
	store: Writable<PlayerState>,
	audioElement: HTMLAudioElement
): void {
	if (!('mediaSession' in navigator)) return;

	navigator.mediaSession.setActionHandler('play', () => {
		audioElement.play()?.catch(() => {});
		store.update((s) => ({ ...s, isPlaying: true }));
		updateMediaSessionPlaybackState(true);
	});

	navigator.mediaSession.setActionHandler('pause', () => {
		audioElement.pause();
		store.update((s) => ({ ...s, isPlaying: false }));
		updateMediaSessionPlaybackState(false);
	});

	navigator.mediaSession.setActionHandler('previoustrack', () => {
		decrementCurrentTrackIndex(store);
	});

	navigator.mediaSession.setActionHandler('nexttrack', () => {
		incrementCurrentTrackIndex(store);
	});
}
