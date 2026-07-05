import { execFile } from 'node:child_process';

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
	 * Query the disc and return the number of audio tracks. Throws if the
	 * device is unavailable or cdparanoia reports no tracks.
	 */
	async getTrackCount(): Promise<number> {
		const { stdout, stderr } = await this.exec(['-Q', '-d', this.device]);
		const output = `${stdout}\n${stderr}`;
		const tracks = this.parseTrackCount(output);

		if (tracks <= 0) {
			throw new Error(
				`No audio tracks found on ${this.device}.\n` +
					`cdparanoia output:\n${output.trim() || '(empty)'}`
			);
		}

		return tracks;
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
	 * Parse the track count from `cdparanoia -Q` output. The TOC lists one
	 * numbered row per track, e.g. `  1.    12653 [02:48.53] 0 [00:00.00] ...`.
	 * Some versions instead print `Track N:` summary lines, so we accept both
	 * shapes. We take the maximum track number seen — robust against header,
	 * `TOTAL`, and separator noise lines (none of which start with a bare
	 * number followed by `.` or `:`).
	 */
	private parseTrackCount(output: string): number {
		let max = 0;
		for (const line of output.split('\n')) {
			const match = /^\s*(?:Track\s+)?(\d+)\s*[.:]/i.exec(line);
			if (match) {
				const n = Number.parseInt(match[1], 10);
				if (n > max) max = n;
			}
		}
		return max;
	}
}
