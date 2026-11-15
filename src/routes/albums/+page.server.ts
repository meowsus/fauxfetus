import { readCatalog } from '$lib/helpers/catalog';
import type { PageServerLoad } from './$types';

/**
 * Every album across every artist — the second browsing axis (by release,
 * as opposed to by creator). The catalog carries no release-date metadata,
 * so the index is alphabetical by title. Each entry keeps the
 * artist/album pair needed to build the canonical
 * `/artists/[artistSlug]/[albumSlug]/` link.
 */
export const load: PageServerLoad = async () => {
	const artists = await readCatalog();

	const albums = artists.flatMap((artist) =>
		artist.albums.map((album) => ({
			slug: album.slug,
			name: album.name,
			artistSlug: album.artistSlug,
			artistName: album.artistName,
			isCompilation: album.isCompilation
		}))
	);

	albums.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

	return { albums };
};
