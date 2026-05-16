import type { PlayerState } from '$lib/context/player';
import type { Track } from '@fauxfetus/generator';
import type { Writable } from 'svelte/store';
import { get } from 'svelte/store';
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

/**
 * Set up Media Session action handlers for lock screen media controls.
 *
 * The next/previous track handlers MUST switch tracks synchronously
 * (setting src + calling play() directly on the audio element) to
 * preserve the browser's "transient activation" granted by the user
 * gesture. Without this, play() is rejected as autoplay on mobile
 * when the screen is off.
 */
export function setupMediaSessionActionHandlers(
	store: Writable<PlayerState>,
	audioElement: HTMLAudioElement,
	playTrackSynchronously: (track: Track) => void
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
		const { currentTrackIndex, playlist } = get(store);
		if (playlist.length === 0) return;
		const prevIndex =
			currentTrackIndex == null
				? playlist.length - 1
				: (currentTrackIndex - 1 + playlist.length) % playlist.length;
		const prevTrack = playlist[prevIndex];
		if (prevTrack) {
			playTrackSynchronously(prevTrack);
		}
		decrementCurrentTrackIndex(store);
	});

	navigator.mediaSession.setActionHandler('nexttrack', () => {
		const { currentTrackIndex, playlist } = get(store);
		if (playlist.length === 0) return;
		const nextIndex = currentTrackIndex == null ? 0 : (currentTrackIndex + 1) % playlist.length;
		const nextTrack = playlist[nextIndex];
		if (nextTrack) {
			playTrackSynchronously(nextTrack);
		}
		incrementCurrentTrackIndex(store);
	});
}
