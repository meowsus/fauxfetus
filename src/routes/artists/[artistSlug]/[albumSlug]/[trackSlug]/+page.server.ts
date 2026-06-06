import { readCatalog } from '$lib/helpers/catalog.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const entries = async () => {
	const entries: Array<{ artistSlug: string; albumSlug: string; trackSlug: string }> = [];

	const catalog = await readCatalog();

	for (const artist of catalog) {
		for (const album of artist.albums) {
			for (const track of album.tracks) {
				entries.push({ artistSlug: artist.slug, albumSlug: album.slug, trackSlug: track.slug });
			}
		}
	}

	return entries;
};

export const load: PageServerLoad = async ({ params }) => {
	const { artistSlug, albumSlug, trackSlug } = params;

	const catalog = await readCatalog();

	const artist = catalog.find((artist) => artist.slug === artistSlug);

	if (!artist) throw error(404, 'Artist not found');

	const album = artist.albums.find((album) => album.slug === albumSlug);

	if (!album) throw error(404, 'Album not found');

	const trackIndex = album.tracks.findIndex((track) => track.slug === trackSlug);

	if (trackIndex === -1) throw error(404, 'Track not found');

	const fullTrack = album.tracks[trackIndex];

	const track = {
		slug: fullTrack.slug,
		name: fullTrack.name,
		artistSlug: fullTrack.artistSlug,
		artistName: fullTrack.artistName,
		albumSlug: fullTrack.albumSlug,
		albumName: fullTrack.albumName,
		isCompilation: fullTrack.isCompilation,
		audioUrl: fullTrack.audioUrl,
		number: fullTrack.number,
		metadata: fullTrack.metadata
	};

	return { track, playlist: album.tracks, startIndex: trackIndex };
};
