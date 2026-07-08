import { execFile } from 'node:child_process';
import type { DiscToc } from './types';

/** CD frames per second (cdparanoia reports lengths in frames). */
const CD_FRAMES_PER_SECOND = 75;

/**
 * Wrapper around `cdparanoia`. Used in two modes:
 *
 *  - Query (`-Q`): report disc TOC so we can count audio tracks.
 *  - Rip (`-Z`): rip a single track to a WAV with full paranoia settings.
 *
 * `cdparanoia -Z` disables the speculative/overlap read pass and does
 * thorough error correction — this is the highest paranoia setting.
 */
export class CdParanoia {
	private readonly device: string;

	constructor(device: string) {
		this.device = device;
	}

	/**
	 * Query the disc and return its table of contents (track count + per-track
	 * lengths in seconds). Throws if the device is unavailable or cdparanoia
	 * reports no tracks.
	 */
	async getToc(): Promise<DiscToc> {
		const { stdout, stderr } = await this.exec(['-Q', '-d', this.device]);
		const output = `${stdout}\n${stderr}`;
		const toc = this.parseToc(output);

		if (toc.trackCount <= 0) {
			throw new Error(
				`No audio tracks found on ${this.device}.\n` +
					`cdparanoia output:\n${output.trim() || '(empty)'}`
			);
		}

		return toc;
	}

	/**
	 * Rip a single track (1-based) to a WAV file with full paranoia (`-Z`).
	 * Resolves once cdparanoia exits; rejects on a non-zero exit code.
	 */
	async ripTrack(trackNumber: number, outputWavPath: string): Promise<void> {
		await this.exec(['-Z', '-d', this.device, String(trackNumber), outputWavPath]);
	}

	/**
	 * Run cdparanoia with the given args and return its buffered output.
	 * Rejects on non-zero exit code. Combined output is available on error
	 * so callers can surface a useful message.
	 */
	private exec(args: string[]): Promise<{ stdout: string; stderr: string }> {
		return new Promise((resolve, reject) => {
			execFile('cdparanoia', args, { maxBuffer: 4 * 1024 * 1024 }, (err, stdout, stderr) => {
				if (err) {
					reject(
						new Error(
							`cdparanoia ${args.join(' ')} failed (exit ${err.code ?? '?'}):\n${stderr || stdout || err.message}`
						)
					);
					return;
				}
				resolve({ stdout, stderr });
			});
		});
	}

	/**
	 * Parse `cdparanoia -Q` output into a disc TOC. The primary TOC row shape
	 * is `  N.  <length-frames> [mm:ss.ff] <begin-frames> [mm:ss.ff] ...`, so we
	 * extract the per-track length in frames (÷ 75 → seconds). Some versions
	 * instead print `Track N:` summary lines (no length); for those we still
	 * recover the track count but leave lengths at 0, which means duration-based
	 * matching against existing rips simply won't find a match (a safe no-op).
	 */
	private parseToc(output: string): DiscToc {
		let maxTrack = 0;
		const lengths: number[] = [];

		for (const line of output.split('\n')) {
			let match = /^\s*(\d+)\.\s+(\d+)\s+\[/i.exec(line);
			if (match) {
				const n = Number.parseInt(match[1], 10);
				const frames = Number.parseInt(match[2], 10);
				if (n > maxTrack) maxTrack = n;
				while (lengths.length < n) lengths.push(0);
				lengths[n - 1] = frames / CD_FRAMES_PER_SECOND;
				continue;
			}

			match = /^\s*Track\s+(\d+)\s*:/i.exec(line);
			if (match) {
				const n = Number.parseInt(match[1], 10);
				if (n > maxTrack) maxTrack = n;
			}
		}

		while (lengths.length < maxTrack) lengths.push(0);
		return { trackCount: maxTrack, trackLengthsSeconds: lengths.slice(0, maxTrack) };
	}
}
