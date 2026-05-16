import type { Track } from '@fauxfetus/generator';

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
