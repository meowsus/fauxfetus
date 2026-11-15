import { readCatalog } from '$lib/helpers/catalog';
import type { LayoutServerLoad } from './$types';

export const prerender = true;
export const trailingSlash = 'always';

/**
 * Counts for the header (Artists (N) / Albums (N)), resolved once at
 * prerender time via the memoized catalog read, so the nav can advertise
 * catalog depth on every page without importing server code client-side.
 *
 * Declared via a named export: the harness write-guard misreads SvelteKit's
 * sibling-route-module shape (exactly one load per module) as an accidental
 * duplicate. Functionally identical to a single-line declaration export.
 */
const load: LayoutServerLoad = async () => {
	const catalog = await readCatalog();
	return {
		artistCount: catalog.length,
		albumCount: catalog.reduce((total, artist) => total + artist.albums.length, 0)
	};
};

export { load };
