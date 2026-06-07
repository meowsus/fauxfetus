import { readCatalog } from '$lib/helpers/catalog.js';
import { readRecommendations } from '$lib/helpers/recommendations.js';
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

	const [catalog, recommendations] = await Promise.all([readCatalog(), readRecommendations()]);
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

	// Resolve recommended slugs to display names. Drop any that aren't in
	// the catalog (defensive — recommendations.json could in theory name
	// a stale slug after a rename).
	const namesBySlug = new Map(catalog.map((a) => [a.slug, a.name]));
	const recommendedArtists = (recommendations[artistSlug] ?? [])
		.map((slug) => {
			const name = namesBySlug.get(slug);
			return name ? { slug, name } : null;
		})
		.filter((entry): entry is { slug: string; name: string } => entry !== null);

	return { artist, recommendedArtists };
};
