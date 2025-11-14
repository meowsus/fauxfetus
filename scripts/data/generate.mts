import fs from 'fs-extra';
import klaw from 'klaw';
import path from 'path';

const CWD = process.cwd();

const READ_PATH = path.resolve(CWD, 'audio/');
const WRITE_PATH = path.resolve(CWD, 'src/lib/assets/data/');

const SKIP_DIR_PATTERN = /^_/;

/**
 * Data generator class.
 *
 * Procedurally generates data for the audio files in the audio directory.
 * This class is not focused on performance, but rather on readability and maintainability.
 */
class DataGenerator {
	/**
	 * List of audio files to generate data for.
	 *
	 * @example
	 * [
	 *   'artist-slug/album-slug/track-slug.mp3',
	 *   'black-pus/black-pus-3/02-Swampus.mp3',
	 * ]
	 */
	audioFileList: string[] = [];

	/**
	 * Build the list of audio files to generate data for.
	 */
	private async buildAudioFileList() {
		console.log('Building audio file list...');

		for await (const file of klaw(READ_PATH)) {
			const relativePath = path.relative(READ_PATH, file.path);

			// Skip files that are not mp3s
			if (!relativePath.endsWith('.mp3')) continue;

			// Skip files that start with the skip pattern
			if (SKIP_DIR_PATTERN.test(relativePath)) continue;

			// Add the relative path to the list
			this.audioFileList.push(relativePath);
		}

		console.log(`Built audio file list with ${this.audioFileList.length} entries`);
	}

	/**
	 * Run the data generator.
	 */
	async run() {
		await this.buildAudioFileList();
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
