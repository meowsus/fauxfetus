export const RADIO_PLAYLIST_SIZE = 49;

export function shuffle<T>(arr: T[]): T[] {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

/**
 * Sample a radio playlist that gives every artist equal representation,
 * regardless of how many tracks they have in the catalog.
 *
 * Algorithm:
 * 1. Group all tracks by artist
 * 2. Randomly select `maxTracks` artists (equal probability per artist)
 * 3. For each selected artist, pick one random track
 * 4. Shuffle the result for playback order
 *
 * With 93 artists and RADIO_PLAYLIST_SIZE slots, ~53% of artists appear each session.
 * Over many sessions every artist gets roughly equal airtime.
 */
export function sampleRadioPlaylist<T extends { artistSlug: string }>(
	tracks: T[],
	maxTracks: number = RADIO_PLAYLIST_SIZE
): T[] {
	const byArtist = new Map<string, T[]>();
	for (const track of tracks) {
		const list = byArtist.get(track.artistSlug);
		if (list) {
			list.push(track);
		} else {
			byArtist.set(track.artistSlug, [track]);
		}
	}

	const artists = shuffle([...byArtist.keys()]);

	const playlist: T[] = [];
	for (const artist of artists) {
		if (playlist.length >= maxTracks) break;
		const artistTracks = byArtist.get(artist)!;
		const track = artistTracks[Math.floor(Math.random() * artistTracks.length)];
		playlist.push(track);
	}

	return shuffle(playlist);
}
