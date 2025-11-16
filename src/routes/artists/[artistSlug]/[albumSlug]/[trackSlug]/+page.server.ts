import { error } from '@sveltejs/kit';
import fs from 'fs-extra';
import { join } from 'path';
import type { PageServerLoad } from './$types';

export const entries = async () => {
	const entries: Array<{ artistSlug: string; albumSlug: string; trackSlug: string }> = [];
	const artistsIndexPath = join(process.cwd(), 'static', 'data', 'index.json');
	const artists: App.ArtistsIndex = await fs.readJson(artistsIndexPath);

	for (const artist of artists) {
		const artistSlug = artist.artistPath.replace('/artists/', '');
		const artistIndexPath = join(process.cwd(), 'static', 'data', artistSlug, 'index.json');
		const artistData: App.ArtistIndex = await fs.readJson(artistIndexPath);

		for (const album of artistData.albums) {
			const albumSlug = album.albumPath.split('/').pop()!;
			const albumIndexPath = join(process.cwd(), 'static', 'data', artistSlug, albumSlug, 'index.json');
			const albumData: App.AlbumIndex = await fs.readJson(albumIndexPath);

			for (const track of albumData.tracks) {
				const trackSlug = track.trackPath.split('/').pop()!;
				entries.push({ artistSlug, albumSlug, trackSlug });
			}
		}
	}

	return entries;
};

export const load: PageServerLoad = async ({ params }) => {
	const { artistSlug, albumSlug, trackSlug } = params;
	const dataPath = join(process.cwd(), 'static', 'data', artistSlug, albumSlug, trackSlug, 'index.json');

	try {
		const track: App.TrackIndex = await fs.readJson(dataPath);
		return { track };
	} catch {
		throw error(404, 'Track not found');
	}
};
