import { readCatalog } from '$lib/helpers/catalog.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const entries = async () => {
	const catalog = await readCatalog();

	return catalog.map((artist) => ({
		artistSlug: artist.slug
	}));
};

export const load: PageServerLoad = async ({ params }) => {
	const { artistSlug } = params;

	const catalog = await readCatalog();
	const fullArtist = catalog.find((artist) => artist.slug === artistSlug);

	if (!fullArtist) {
		throw error(404, 'Artist not found');
	}

	const artist = {
		slug: fullArtist.slug,
		name: fullArtist.name,
		albums: fullArtist.albums.map((album) => ({
			slug: album.slug,
			name: album.name,
			artistSlug: album.artistSlug,
			isCompilation: album.isCompilation
		}))
	};

	return { artist };
};
