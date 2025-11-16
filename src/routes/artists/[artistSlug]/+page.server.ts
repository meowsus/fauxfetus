import { error } from '@sveltejs/kit';
import fs from 'fs-extra';
import { join } from 'path';
import type { PageServerLoad } from './$types';

export const entries = async () => {
	const artistsIndexPath = join(process.cwd(), 'static', 'data', 'index.json');
	const artists: App.ArtistsIndex = await fs.readJson(artistsIndexPath);

	return artists.map((artist) => ({
		artistSlug: artist.artistPath.replace('/artists/', '')
	}));
};

export const load: PageServerLoad = async ({ params }) => {
	const { artistSlug } = params;
	const dataPath = join(process.cwd(), 'static', 'data', artistSlug, 'index.json');

	try {
		const artist: App.ArtistIndex = await fs.readJson(dataPath);
		return { artist };
	} catch {
		throw error(404, 'Artist not found');
	}
};
