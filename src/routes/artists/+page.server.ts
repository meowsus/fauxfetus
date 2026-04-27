import { readCatalog } from '$lib/helpers/catalog.js';

export const load = async () => {
	const catalog = await readCatalog();
	const artists = catalog.map((artist) => ({
		slug: artist.slug,
		name: artist.name
	}));
	return { artists };
};
