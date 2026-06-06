export const RADIO_PLAYLIST_SIZE = 49;

export function shuffle<T>(arr: T[]): T[] {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

/**
 * Sample a radio playlist that gives soft preference to prolific artists
 * without drowning out artists with small catalogs.
 *
 * Algorithm:
 * 1. Weight each track by `1 / trackCount^0.75`. A 1-track artist's track
 *    has weight 1, a 36-track artist's tracks have weight ~1/15, a
 *    198-track artist's tracks have weight ~1/43.
 * 2. Sample `maxTracks` tracks with weighted random.
 * 3. Apply a defensive cap of 5 slots per artist so a single prolific
 *    artist can never dominate one session.
 * 4. Never return the same `audioUrl` twice — compilation tracks that
 *    appear under multiple artists in the catalog still count as one
 *    playable item.
 *
 * Why sub-linear (0.75) instead of 1/c?
 * - The previous "equal per artist" approach gave 1-track artists ~53%
 *   appear rate — too dominant.
 * - The original random approach gave 1-track artists ~1.5% — too rare.
 * - 1/c^0.75 lands 1-track artists at ~21%, mid-size at ~35-45%, and
 *   100+ track artists at ~55%, which is a smoother, more "musical"
 *   gradient that respects catalog depth without silencing outliers.
 */
export function sampleRadioPlaylist<T extends { artistSlug: string; audioUrl: string }>(
	tracks: T[],
	maxTracks: number = RADIO_PLAYLIST_SIZE
): T[] {
	const trackCountByArtist = new Map<string, number>();
	for (const track of tracks) {
		trackCountByArtist.set(track.artistSlug, (trackCountByArtist.get(track.artistSlug) ?? 0) + 1);
	}

	const weights = tracks.map((t) => 1 / Math.pow(trackCountByArtist.get(t.artistSlug)!, 0.75));

	const PER_ARTIST_CAP = 5;
	const slotsByArtist = new Map<string, number>();
	const usedAudioUrls = new Set<string>();
	const playlist: T[] = [];

	for (let i = 0; i < maxTracks; i++) {
		let availableWeight = 0;
		for (let j = 0; j < tracks.length; j++) {
			if (usedAudioUrls.has(tracks[j].audioUrl)) continue;
			const artist = tracks[j].artistSlug;
			if ((slotsByArtist.get(artist) ?? 0) >= PER_ARTIST_CAP) continue;
			availableWeight += weights[j];
		}
		if (availableWeight === 0) break;

		let r = Math.random() * availableWeight;
		for (let j = 0; j < tracks.length; j++) {
			if (usedAudioUrls.has(tracks[j].audioUrl)) continue;
			const artist = tracks[j].artistSlug;
			if ((slotsByArtist.get(artist) ?? 0) >= PER_ARTIST_CAP) continue;
			r -= weights[j];
			if (r <= 0) {
				playlist.push(tracks[j]);
				usedAudioUrls.add(tracks[j].audioUrl);
				slotsByArtist.set(artist, (slotsByArtist.get(artist) ?? 0) + 1);
				break;
			}
		}
	}

	return playlist;
}
