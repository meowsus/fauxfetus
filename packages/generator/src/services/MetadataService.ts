import { parseBuffer, type IAudioMetadata } from 'music-metadata';
import { z } from 'zod';
import type { TrackIndexData, TrackUri } from '../../types';

const MetadataSchema = z.object({
	albumName: z.string().nonempty(),
	artistName: z.string().nonempty(),
	trackName: z.string().nonempty(),
	trackNumber: z.number().positive().nullable()
});

export class MetadataService {
	extractTrackIndexData(trackUri: TrackUri, metadata: IAudioMetadata): TrackIndexData {
		const result = MetadataSchema.safeParse({
			albumName: metadata.common.album,
			artistName: metadata.common.artist,
			trackName: metadata.common.title,
			trackNumber: metadata.common.track.no
		});

		if (!result.success) {
			throw new Error(`Issue extracting track data: ${result.error}`);
		}

		const [artistSlug, albumSlug] = this.discoverSlugs(trackUri);

		return {
			trackUri,
			artistPath: `/artists/${artistSlug}`,
			albumPath: `/artists/${artistSlug}/${albumSlug}`,
			audioUrl: `/audio/${trackUri}.mp3`,
			...result.data
		};
	}

	/**
	 * Extracts artist and album slugs from a track URI.
	 * Handles both regular and special track formats.
	 * Regular track format: `artist-slug/album-slug/track-slug`
	 * Special track format: `_<TYPE>/album-slug/track-number_artist-slug_track-name`
	 *
	 * @param trackUri
	 * @returns [artistSlug, albumSlug]
	 */
	private discoverSlugs(trackUri: TrackUri): [string, string] {
		const uriChunks = trackUri.split('/');

		if (!trackUri.startsWith('_')) {
			return [uriChunks[0], uriChunks[1]];
		}

		const trackSlug = uriChunks[2];
		const trackChunks = trackSlug.split('_');

		return [trackChunks[1], uriChunks[1]];
	}

	async parseAudioBuffer(buffer: Buffer): Promise<IAudioMetadata> {
		return parseBuffer(buffer, { mimeType: 'audio/mpeg' });
	}
}
