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

	const album = artist.albums.find((album) => album.slug === albumSlug);

	if (!album) throw error(404, 'Album not found');

	return { album };
};
