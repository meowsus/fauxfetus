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

	const track = album.tracks.find((track) => track.slug === trackSlug);

	if (!track) throw error(404, 'Track not found');

	return { track };
};
