import fs from 'fs-extra';
import klaw from 'klaw';
import { parseBuffer, type IAudioMetadata } from 'music-metadata';
import path from 'path';
import { z } from 'zod';
import type {
	AlbumIndexData,
	ArtistIndexData,
	ArtistsIndexData,
	Catalog,
	StructuredCatalog,
	TrackIndexData
} from './types';

const SKIP_DIR_PATTERN = /^_/;

const MetadataSchema = z.object({
	albumName: z.string().nonempty(),
	artistName: z.string().nonempty(),
	trackName: z.string().nonempty(),
	trackNumber: z.number().positive().nullable()
});

export default class DataGenerator {
	trackUris: string[] = [];

	catalog: Catalog = [];

	structuredCatalog: StructuredCatalog = {};

	readPath: string = '';

	writePath: string = '';

	constructor(readPath: string, writePath: string) {
		this.readPath = readPath;
		this.writePath = writePath;
	}

	private async buildTrackUris(): Promise<void> {
		console.log('Building track URI list...');

		for await (const file of klaw(this.readPath)) {
			const relativePath = path.relative(this.readPath, file.path);

			// Skip files that are not mp3s
			if (!relativePath.endsWith('.mp3')) continue;

			// Skip files that start with the skip pattern
			if (SKIP_DIR_PATTERN.test(relativePath)) continue;

			// Remove the extension from the path
			const [trackUri] = relativePath.split('.mp3');

			// Add the URI to the list
			this.trackUris.push(trackUri);
		}

		console.log(`Finished building audio file list: ${this.trackUris.length} entries`);
	}

	private extractTrackIndexData(trackUri: string, metadata: IAudioMetadata): TrackIndexData {
		// Prepare and parse flattened, important metadata
		const result = MetadataSchema.safeParse({
			albumName: metadata.common.album,
			artistName: metadata.common.artist,
			trackName: metadata.common.title,
			trackNumber: metadata.common.track.no
		});

		// Fail fast if data is inconsistent
		if (!result.success) {
			console.error(`Issue extracting track data:`, result.error);
			process.exit(1);
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

	private async buildCatalog() {
		console.log('Building catalog...');

		for (const trackUri of this.trackUris) {
			const mp3Path = `${this.readPath}/${trackUri}.mp3`;

			const buffer = await fs.readFile(mp3Path);
			const metadata = await parseBuffer(buffer, { mimeType: 'audio/mpeg' });

			const trackIndexData: TrackIndexData = this.extractTrackIndexData(trackUri, metadata);

			this.catalog.push(trackIndexData);
		}

		console.log('Built catalog');
	}

	private async buildStructuredCatalog() {
		console.log('Building structured catalog...');

		for (const trackIndexData of this.catalog) {
			const [artistSlug, albumSlug, trackSlug] = trackIndexData.trackUri.split('/');

			if (!this.structuredCatalog[artistSlug]) {
				this.structuredCatalog[artistSlug] = {};
			}

			if (!this.structuredCatalog[artistSlug][albumSlug]) {
				this.structuredCatalog[artistSlug][albumSlug] = {};
			}

			this.structuredCatalog[artistSlug][albumSlug][trackSlug] = trackIndexData;
		}

		console.log('Built structured catalog');
	}

	private async createDataDirectory() {
		console.log('Creating data directory...');

		// Empty the write directory
		await fs.emptyDir(this.writePath);

		// Stub the artists data
		const artistsIndexData: ArtistsIndexData = [];

		// Iterate over artists
		for (const artistSlug of Object.keys(this.structuredCatalog)) {
			// Stub artist data
			const artistIndexData: ArtistIndexData = { artistName: '', albums: [] };

			// Iterate over albums
			for (const albumSlug of Object.keys(this.structuredCatalog[artistSlug])) {
				// Find the first track of the album, assuming consistent data
				const albumTracks = this.structuredCatalog[artistSlug][albumSlug];
				const firstTrackSlug = Object.keys(albumTracks)[0];
				const firstTrack = albumTracks[firstTrackSlug];

				// Stub the album data, using first track
				const albumIndexData: AlbumIndexData = {
					artistName: firstTrack.artistName,
					artistPath: firstTrack.artistPath,
					albumName: firstTrack.albumName,
					tracks: []
				};

				// Fill in the artist data stub, if necessary
				if (artistIndexData.artistName === '') {
					artistIndexData.artistName = firstTrack.artistName;
				}

				// Iterate over the
				for (const trackSlug of Object.keys(this.structuredCatalog[artistSlug][albumSlug])) {
					const trackIndexData: TrackIndexData =
						this.structuredCatalog[artistSlug][albumSlug][trackSlug];

					// Create the track directory
					await fs.mkdirp(`${this.writePath}/${trackIndexData.trackUri}`);

					// Write the track index file
					const trackIndexFilePath = `${this.writePath}/${trackIndexData.trackUri}/index.json`;
					await fs.writeJson(trackIndexFilePath, trackIndexData);

					// Push the track data into the album
					albumIndexData.tracks.push({
						trackName: trackIndexData.trackName,
						trackNumber: trackIndexData.trackNumber,
						audioUrl: trackIndexData.audioUrl,
						trackPath: `/artists/${trackIndexData.trackUri}`
					});
				}

				// Write the album index file
				const albumIndexFilePath = `${this.writePath}/${artistSlug}/${albumSlug}/index.json`;
				await fs.writeJson(albumIndexFilePath, albumIndexData);

				// Push the album data into the artist
				artistIndexData.albums.push({
					albumName: albumIndexData.albumName,
					albumPath: `/artists/${artistSlug}/${albumSlug}`
				});
			}

			// Write the artist index file
			const artistIndexFilePath = `${this.writePath}/${artistSlug}/index.json`;
			await fs.writeJson(artistIndexFilePath, artistIndexData);

			// Push the artist data into the artists
			artistsIndexData.push({
				artistName: artistIndexData.artistName,
				artistPath: `/artists/${artistSlug}`
			});
		}

		// Write the artists index file
		const artistsIndexFilePath = `${this.writePath}/index.json`;
		await fs.writeJson(artistsIndexFilePath, artistsIndexData);

		console.log('Created data directory');
	}

	private async ensurePathsExist() {
		try {
			await fs.ensureDir(this.readPath);
			await fs.ensureDir(this.writePath);
		} catch (error) {
			console.error('Error ensuring directory:', error);
			process.exit(1);
		}
	}

	async run() {
		await this.ensurePathsExist();
		await this.buildTrackUris();
		await this.buildCatalog();
		await this.buildStructuredCatalog();
		await this.createDataDirectory();
	}
}
