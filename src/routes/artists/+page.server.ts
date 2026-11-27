import { readCatalog } from '#lib/helpers/catalog.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const catalog = await readCatalog();
	const artists = catalog.map((artist) => ({
		slug: artist.slug,
		name: artist.name,
		albumCount: artist.albums.length
	}));
	return { artists };
};
