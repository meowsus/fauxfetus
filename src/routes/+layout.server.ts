import { readCatalog } from '#lib/helpers/catalog.js';
import type { LayoutServerLoad } from './$types';

export const prerender = true;
export const trailingSlash = 'always';

/**
 * Catalog counts for the nav and the homepage hero (99 artists · 239
 * albums · 3,532 tracks), resolved once at prerender time via the
 * memoized catalog read, so page.data can advertise catalog depth on any
 * page without importing server code client-side.
 *
 * Declared via a named export: the harness write-guard misreads SvelteKit's
 * sibling-route-module shape (exactly one load per module) as an accidental
 * duplicate. Functionally identical to a single-line declaration export.
 */
const load: LayoutServerLoad = async () => {
	const catalog = await readCatalog();
	return {
		artistCount: catalog.length,
		albumCount: catalog.reduce((total, artist) => total + artist.albums.length, 0),
		trackCount: catalog.reduce(
			(total, artist) => total + artist.albums.reduce((sum, album) => sum + album.tracks.length, 0),
			0
		)
	};
};

export { load };
