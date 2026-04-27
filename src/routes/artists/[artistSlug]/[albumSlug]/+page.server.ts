import { readCatalog } from '$lib/helpers/catalog.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const entries = async () => {
	const entries: Array<{ artistSlug: string; albumSlug: string }> = [];

	const catalog = await readCatalog();

	for (const artist of catalog) {
		for (const album of artist.albums) {
			entries.push({ artistSlug: artist.slug, albumSlug: album.slug });
		}
	}

	return entries;
};

export const load: PageServerLoad = async ({ params }) => {
	const { artistSlug, albumSlug } = params;

	const catalog = await readCatalog();

	const artist = catalog.find((artist) => artist.slug === artistSlug);

	if (!artist) throw error(404, 'Artist not found');

	const fullAlbum = artist.albums.find((album) => album.slug === albumSlug);

	if (!fullAlbum) throw error(404, 'Album not found');

	const album = {
		slug: fullAlbum.slug,
		name: fullAlbum.name,
		artistSlug: fullAlbum.artistSlug,
		artistName: fullAlbum.artistName,
		isCompilation: fullAlbum.isCompilation,
		tracks: fullAlbum.tracks.map((track) => ({
			slug: track.slug,
			name: track.name,
			artistSlug: track.artistSlug,
			artistName: track.artistName,
			albumSlug: track.albumSlug,
			albumName: track.albumName,
			isCompilation: track.isCompilation,
			audioUrl: track.audioUrl,
			number: track.number
		}))
	};

	return { album };
};
