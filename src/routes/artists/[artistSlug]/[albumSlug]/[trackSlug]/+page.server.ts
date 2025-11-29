import type {
	AlbumIndexData,
	ArtistIndexData,
	ArtistsIndexData,
	TrackIndexData
} from '@fauxfetus/generator';
import { error } from '@sveltejs/kit';
import fs from 'fs-extra';
import { join } from 'path';
import type { PageServerLoad } from './$types';

export const entries = async () => {
	const entries: Array<{ artistSlug: string; albumSlug: string; trackSlug: string }> = [];
	const artistsIndexPath = join(process.cwd(), 'static', 'data', 'index.json');
	const artists: ArtistsIndexData = await fs.readJson(artistsIndexPath);

	for (const artist of artists) {
		const artistSlug = artist.artistPath.replace('/artists/', '');
		const artistIndexPath = join(process.cwd(), 'static', 'data', artistSlug, 'index.json');
		const artistData: ArtistIndexData = await fs.readJson(artistIndexPath);

		for (const album of artistData.albums) {
			const albumSlug = album.albumPath.split('/').pop()!;
			const albumIndexPath = join(
				process.cwd(),
				'static',
				'data',
				artistSlug,
				albumSlug,
				'index.json'
			);
			const albumData: AlbumIndexData = await fs.readJson(albumIndexPath);

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
	const dataPath = join(
		process.cwd(),
		'static',
		'data',
		artistSlug,
		albumSlug,
		trackSlug,
		'index.json'
	);

	try {
		const track: TrackIndexData = await fs.readJson(dataPath);
		return { track };
	} catch {
		throw error(404, 'Track not found');
	}
};
