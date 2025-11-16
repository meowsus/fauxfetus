import { error } from '@sveltejs/kit';
import fs from 'fs-extra';
import { join } from 'path';
import type { PageServerLoad } from './$types';

export const entries = async () => {
	const entries: Array<{ artistSlug: string; albumSlug: string }> = [];
	const artistsIndexPath = join(process.cwd(), 'static', 'data', 'index.json');
	const artists: App.ArtistsIndex = await fs.readJson(artistsIndexPath);

	for (const artist of artists) {
		const artistSlug = artist.artistPath.replace('/artists/', '');
		const artistIndexPath = join(process.cwd(), 'static', 'data', artistSlug, 'index.json');
		const artistData: App.ArtistIndex = await fs.readJson(artistIndexPath);

		for (const album of artistData.albums) {
			const albumSlug = album.albumPath.split('/').pop()!;
			entries.push({ artistSlug, albumSlug });
		}
	}

	return entries;
};

export const load: PageServerLoad = async ({ params }) => {
	const { artistSlug, albumSlug } = params;
	const dataPath = join(process.cwd(), 'static', 'data', artistSlug, albumSlug, 'index.json');

	try {
		const album: App.AlbumIndex = await fs.readJson(dataPath);
		return { album };
	} catch {
		throw error(404, 'Album not found');
	}
};
