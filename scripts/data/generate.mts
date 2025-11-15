import type {} from '../../src/app.d.ts';

import fs from 'fs-extra';
import klaw from 'klaw';
import { parseBuffer, type IAudioMetadata } from 'music-metadata';
import path from 'path';
import { z } from 'zod';

const CWD = process.cwd();

const READ_PATH = path.resolve(CWD, 'audio');
const WRITE_PATH = path.resolve(CWD, 'src/lib/assets/data');

const SKIP_DIR_PATTERN = /^_/;

const MetadataSchema = z.object({
	duration: z.number().positive(),
	album: z.string().nonempty(),
	artist: z.string().nonempty(),
	composer: z.array(z.string().nonempty()),
	title: z.string().nonempty(),
	track: z.number().positive().nullable()
});

/**
 * Data generator class.
 *
 * Procedurally generates data for the audio files in the audio directory.
 * This class is not focused on performance, but rather on readability and maintainability.
 */
class DataGenerator {
	/**
	 * A list of URIs representing paths to each track
	 *
	 * @example
	 * [
	 *   'artist-slug/album-slug/title-slug', ...
	 * ]
	 */
	trackUris: string[] = [];

	/**
	 * A dictionary of music-metadata objects, organized by
	 * track slug, album slug, and artist slug.
	 *
	 * @example
	 * {
	 *   'artist-slug': {
	 *     'album-slug': {
	 *       'title-slug': { ... } // Relevant metadata
	 *     }
	 *   }
	 * }
	 */
	trackMetadataDictionary: Record<string, Record<string, Record<string, App.TrackMetadata>>> = {};

	/**
	 * A list of URIs representing paths to each album
	 *
	 * @example
	 * [
	 *   'artist-slug/album-slug', ...
	 * ]
	 */
	get albumUris() {
		return Array.from(new Set(this.trackUris.map((uri) => uri.slice(0, uri.lastIndexOf('/')))));
	}

	/**
	 * Create a list of URIs to help locate files.
	 */
	private async buildTrackUris(): Promise<void> {
		console.log('Building track URI list...');

		for await (const file of klaw(READ_PATH)) {
			const relativePath = path.relative(READ_PATH, file.path);

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

	/**
	 * Validates and extracts track data from IAudioMetadata
	 */
	private extractTrackMetadata(metadata: IAudioMetadata): App.TrackMetadata {
		// Prepare and parse flattened, important metadata
		const result = MetadataSchema.safeParse({
			duration: metadata.format.duration,
			album: metadata.common.album,
			artist: metadata.common.artist,
			composer: metadata.common.composer ?? [],
			title: metadata.common.title,
			track: metadata.common.track.no
		});

		// Fail fast if data is inconsistent
		if (!result.success) {
			console.error(`Issue extracting track data:`, result.error);
			process.exit(1);
		}

		return result.data;
	}

	/**
	 * Builds the track data dictionary
	 */
	private async buildTrackMetadataDictionary(): Promise<void> {
		console.log('Building track data dictionary...');

		for (const trackUri of this.trackUris) {
			const [artistSlug, albumSlug, titleSlug] = trackUri.split('/');

			// Open & read the file buffer
			const buffer = await fs.readFile(`${READ_PATH}/${trackUri}.mp3`);
			const metadata = await parseBuffer(buffer, { mimeType: 'audio/mpeg' });
			const trackMetadata = this.extractTrackMetadata(metadata);

			// Create the artist entry, if necessary
			if (!this.trackMetadataDictionary?.[artistSlug]) {
				this.trackMetadataDictionary[artistSlug] = {};
			}

			// Create the album entry, if necessary
			if (!this.trackMetadataDictionary[artistSlug]?.[albumSlug]) {
				this.trackMetadataDictionary[artistSlug][albumSlug] = {};
			}

			// Store the metadata
			this.trackMetadataDictionary[artistSlug][albumSlug][titleSlug] = trackMetadata;
		}

		console.log('Built track data dictionary');
	}

	/**
	 * Stores the track data to disk
	 */
	private async saveTrackData(): Promise<void> {
		console.log('Saving track data...');

		await fs.emptyDir(WRITE_PATH);

		for (const trackUri of this.trackUris) {
			const [artistSlug, albumSlug, titleSlug] = trackUri.split('/');

			const trackMetadata = this.trackMetadataDictionary[artistSlug][albumSlug][titleSlug];
			const trackData: App.Track = { ...trackMetadata, artistSlug, albumSlug, titleSlug };

			const jsonDirectory = `${WRITE_PATH}/${artistSlug}/${albumSlug}`;
			const jsonWritePath = `${jsonDirectory}/${titleSlug}.json`;

			await fs.mkdirp(jsonDirectory);
			await fs.writeJson(jsonWritePath, trackData);
		}

		console.log('Saved track data');
	}

	/**
	 * Generates and stores the album index data files
	 */
	private async saveAlbumData(): Promise<void> {
		console.log('Generating album data...');

		for (const albumUri of this.albumUris) {
			const directory = `${WRITE_PATH}/${albumUri}`;
			const filename = `${directory}/index.json`;

			const [artistSlug, albumSlug] = albumUri.split('/');

			const albumData: App.Album = { artistSlug, albumSlug, artist: '', album: '', tracks: [] };

			for await (const file of klaw(directory, { depthLimit: 1 })) {
				// If it's not a JSON file, we don't want it
				if (!file.path.endsWith('.json')) continue;

				// Read the track file
				const trackData: App.Track = await fs.readJson(file.path);

				// Assume the first entry's artist & album name applies to the entire directory
				if (albumData.artist === '') albumData.artist = trackData.artist;
				if (albumData.album === '') albumData.album = trackData.album;

				// Push the track data into the album
				albumData.tracks.push(trackData);
			}

			await fs.writeJson(filename, albumData);
		}

		console.log('Generated album data...');
	}

	/**
	 * Generates and stores the artist index data files
	 */
	private async saveArtistData(): Promise<void> {
		console.log('Generating artist data...');

		for (const artistSlug of Object.keys(this.trackMetadataDictionary)) {
			const directory = `${WRITE_PATH}/${artistSlug}`;
			const filename = `${directory}/index.json`;

			const artistData: App.Artist = { artistSlug, artist: '', albums: [] };

			for await (const file of klaw(directory, { depthLimit: 1 })) {
				// If it's not an album index file, we don't want it
				if (!file.path.endsWith('index.json')) continue;

				// Read the album file
				const albumData: App.Album = await fs.readJson(file.path);

				// Assume the first entry's album name applies to the entire directory
				if (artistData.artist === '') artistData.artist = albumData.artist;

				// Push the track data into the album
				artistData.albums.push(albumData);
			}

			await fs.writeJson(filename, artistData);
		}

		console.log('Generated artist data...');
	}

	/**
	 * Run the data generator.
	 */
	async run() {
		await this.buildTrackUris();
		await this.buildTrackMetadataDictionary();
		await this.saveTrackData();
		await this.saveAlbumData();
		await this.saveArtistData();
	}
}

// Ensure the read and write paths exist
try {
	await fs.ensureDir(READ_PATH);
	await fs.ensureDir(WRITE_PATH);
} catch (error) {
	console.error('Error ensuring directory:', error);
	process.exit(1);
}

// Run the data generator
await new DataGenerator().run();
