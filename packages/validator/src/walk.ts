import fs from 'fs-extra';
import klaw from 'klaw';
import { parseBuffer, type IAudioMetadata } from 'music-metadata';
import path from 'path';

const SKIP_DIR_PATTERN = /^_RETIRED/;

/**
 * Walk `readPath` for `.mp3` files (skipping `_RETIRED` directories) and
 * parse metadata. Returns the raw tuples so callers can do something other
 * than validate (e.g. generate catalog data from the same source).
 */
export async function readAudioMetadata(
	readPath: string
): Promise<[audioUrl: string, metadata: IAudioMetadata][]> {
	await fs.ensureDir(readPath);

	const tuples: [audioUrl: string, metadata: IAudioMetadata][] = [];

	for await (const file of klaw(readPath)) {
		const relativePath = path.relative(readPath, file.path);

		if (!relativePath.endsWith('.mp3')) continue;
		if (SKIP_DIR_PATTERN.test(relativePath)) continue;

		const buffer = await fs.readFile(file.path);
		const metadata = await parseBuffer(buffer, { mimeType: 'audio/mpeg' });

		tuples.push([relativePath, metadata]);
	}

	return tuples;
}
