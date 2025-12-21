import fs from 'fs-extra';
import klaw from 'klaw';
import path from 'path';
import type { TrackUri } from '../../types';

export class FileSystemService {
	async readMp3File(filePath: string): Promise<Buffer> {
		return fs.readFile(filePath);
	}

	async getTrackUris(readPath: string): Promise<TrackUri[]> {
		const trackUris: TrackUri[] = [];
		const SKIP_DIR_PATTERN = /^_/;

		for await (const file of klaw(readPath)) {
			const relativePath = path.relative(readPath, file.path);

			if (!relativePath.endsWith('.mp3')) continue;
			if (SKIP_DIR_PATTERN.test(relativePath)) continue;

			const [trackUri] = relativePath.split('.mp3');
			trackUris.push(trackUri as TrackUri);
		}

		return trackUris;
	}

	async writeJsonFile(filePath: string, data: unknown): Promise<void> {
		await fs.writeJson(filePath, data);
	}

	async createDirectory(dirPath: string): Promise<void> {
		await fs.mkdirp(dirPath);
	}

	async emptyDirectory(dirPath: string): Promise<void> {
		await fs.emptyDir(dirPath);
	}

	async ensureDirectoryExists(dirPath: string): Promise<void> {
		await fs.ensureDir(dirPath);
	}
}
