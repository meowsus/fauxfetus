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

		const [artistSlug, albumSlug] = trackUri.split('/');

		return {
			trackUri,
			artistPath: `/artists/${artistSlug}`,
			albumPath: `/artists/${artistSlug}/${albumSlug}`,
			audioUrl: `/audio/${trackUri}.mp3`,
			...result.data
		};
	}

	async parseAudioBuffer(buffer: Buffer): Promise<IAudioMetadata> {
		return parseBuffer(buffer, { mimeType: 'audio/mpeg' });
	}
}
