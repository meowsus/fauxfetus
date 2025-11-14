import fs from 'fs-extra';
import klaw from 'klaw';
import path from 'path';

const CWD = process.cwd();

const READ_PATH = path.resolve(CWD, 'audio');
const WRITE_PATH = path.resolve(CWD, 'src/lib/assets/data');

const SKIP_DIR_PATTERN = /^_/;

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
	 *   'artist-slug/album-slug/track-slug', ...
	 * ]
	 */
	trackUris: string[] = [];

	/**
	 * Create a list of URIs to help locate files.
	 */
	private async buildTrackUris() {
		console.log('Building track URI list...');

		for await (const file of klaw(READ_PATH)) {
			const relativePath = path.relative(READ_PATH, file.path);

			// Skip files that are not mp3s
			if (!relativePath.endsWith('.mp3')) continue;

			// Skip files that start with the skip pattern
			if (SKIP_DIR_PATTERN.test(relativePath)) continue;

			// Remove the extension from the path
			const [uri] = relativePath.split('.mp3');

			// Add the URI to the list
			this.trackUris.push(uri);
		}

		console.log(`Finished building audio file list: ${this.trackUris.length} entries`);
	}

	/**
	 * Seed the write directory with basic, URI-based data.
	 */
	private async seedWriteDirectory() {
		console.log('Seeding write directory...');

		// Empty the data directory
		await fs.emptyDir(WRITE_PATH);

		for (const uri of this.trackUris) {
			const [artistSlug, albumSlug, trackSlug] = uri.split('/');

			const jsonDirectory = `${WRITE_PATH}/${artistSlug}/${albumSlug}`;
			const jsonWritePath = `${jsonDirectory}/${trackSlug}.json`;

			await fs.mkdirp(jsonDirectory);
			await fs.writeJson(jsonWritePath, {
				artistSlug,
				albumSlug,
				trackSlug
			});
		}

		console.log(`Finished seeding write directory.`);
	}

	/**
	 * Run the data generator.
	 */
	async run() {
		await this.buildTrackUris();
		await this.seedWriteDirectory();
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
