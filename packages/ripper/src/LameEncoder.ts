import { execFile } from 'node:child_process';

/**
 * Wrapper around `lame`. Encodes WAV → MP3 with the V0 VBR preset (highest
 * quality, ~245 kbps average) and writes no ID3 tags — we write APEv2 tags
 * ourselves so the validator sees exactly one tag type.
 *
 * No `--no-id3*` flag is passed because lame writes no ID3 tags by default:
 * it only emits an ID3v1 tag when tag fields (`--tt`, `--ta`, ...) are supplied,
 * and only an ID3v2 tag when a field won't fit v1 or `--add-id3v2`/
 * `--id3v2-only` is given. We pass neither, and the cdparanoia WAV input
 * carries no tags, so the output is tag-free. `Apev2Writer.write` additionally
 * strips any stray ID3v1/ID3v2 tags before writing APEv2, so the "APEv2 only"
 * guarantee holds regardless of the lame build (some older builds don't even
 * recognize `--no-id3v1`/`--no-id3v2`).
 */
export class LameEncoder {
	/**
	 * Encode `inputWavPath` to `outputMp3Path` with `-V0`. Rejects on a
	 * non-zero exit code.
	 */
	async encode(inputWavPath: string, outputMp3Path: string): Promise<void> {
		await new Promise<void>((resolve, reject) => {
			execFile(
				'lame',
				['-V0', inputWavPath, outputMp3Path],
				{ maxBuffer: 4 * 1024 * 1024 },
				(err, stdout, stderr) => {
					if (err) {
						reject(
							new Error(
								`lame encode failed (exit ${err.code ?? '?'}):\n${stderr || stdout || err.message}`
							)
						);
						return;
					}
					resolve();
				}
			);
		});
	}
}
