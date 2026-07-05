import { execFile } from 'node:child_process';

/**
 * CD-TEXT data parsed from `cdrdao cdtext`. Every field is nullable: many
 * discs (self-released/demo CDs in particular) carry no CD-TEXT at all, and
 * even when CD-TEXT is present a given field may be absent. The ripper uses
 * non-null values as prompt defaults and falls back to empty defaults
 * otherwise.
 */
export interface CdTextData {
	albumTitle: string | null;
	artistName: string | null;
	composer: string | null;
	/** Per-track TITLE, indexed by track number (trackTitles[N-1] is track N). */
	trackTitles: (string | null)[];
}

const EMPTY: CdTextData = {
	albumTitle: null,
	artistName: null,
	composer: null,
	trackTitles: []
};

/**
 * CD-TEXT field names we parse. cdrdao emits a fixed set of field names
 * (TITLE, PERFORMER, COMPOSER, SONGWRITER, ARRANGER, MESSAGE, ISRC,
 * DISC_ID); we only ever look up TITLE, PERFORMER, and COMPOSER. Validating
 * against this allowlist before building a regex keeps the field lookup
 * parameterized and avoids constructing a regex from arbitrary input.
 */
const ALLOWED_FIELDS = new Set(['TITLE', 'PERFORMER', 'COMPOSER']);

/**
 * Wrapper around `cdrdao cdtext`. Best-effort: if the disc has no CD-TEXT,
 * `cdrdao` fails, or the output can't be parsed, `read()` returns a result
 * of all-null fields and the ripper proceeds with fully manual prompts.
 */
export class CdTextReader {
	private readonly device: string;

	constructor(device: string) {
		this.device = device;
	}

	/**
	 * Read CD-TEXT from the disc. Never throws — a failure (no CD-TEXT,
	 * missing `cdrdao`, parse error) yields all-null fields.
	 */
	async read(): Promise<CdTextData> {
		let output: string;
		try {
			const { stdout, stderr } = await this.exec(['cdtext', '--device', this.device]);
			output = `${stdout}\n${stderr}`;
		} catch {
			return { ...EMPTY };
		}

		try {
			return CdTextReader.parse(output);
		} catch {
			return { ...EMPTY };
		}
	}

	/**
	 * Run cdrdao with the given args and return its buffered output.
	 */
	private exec(args: string[]): Promise<{ stdout: string; stderr: string }> {
		return new Promise((resolve, reject) => {
			execFile('cdrdao', args, { maxBuffer: 4 * 1024 * 1024 }, (err, stdout, stderr) => {
				if (err) {
					reject(err);
					return;
				}
				resolve({ stdout, stderr });
			});
		});
	}

	/**
	 * Parse `cdrdao cdtext` output into disc-level and per-track fields.
	 *
	 * The output is a tree of `CD_TEXT { LANGUAGE 0 { FIELD "value" } }`
	 * blocks: one disc-level block (before any `TRACK` line) and one per
	 * track block (each introduced by a `TRACK N` line). We only care about
	 * TITLE, PERFORMER, and COMPOSER.
	 */
	private static parse(output: string): CdTextData {
		// Split into a disc-level prefix (everything before the first TRACK
		// line) and the remainder, which holds per-track blocks.
		const firstTrack = output.search(/^\s*TRACK\s+\d+\b/im);
		const discSection = firstTrack === -1 ? output : output.slice(0, firstTrack);
		const tracksSection = firstTrack === -1 ? '' : output.slice(firstTrack);

		const albumTitle = CdTextReader.field(discSection, 'TITLE');
		const artistName = CdTextReader.field(discSection, 'PERFORMER');
		const composer = CdTextReader.field(discSection, 'COMPOSER');

		const trackTitles: (string | null)[] = [];
		if (tracksSection) {
			const trackBlocks = tracksSection.split(/^\s*TRACK\s+\d+\b/im).slice(1);
			for (const block of trackBlocks) {
				trackTitles.push(CdTextReader.field(block, 'TITLE'));
			}
		}

		return { albumTitle, artistName, composer, trackTitles };
	}

	/**
	 * Extract the first `FIELD "value"` from a CD-TEXT block, returning the
	 * unquoted value or null if absent. `name` must be one of the allowed
	 * CD-TEXT field names (validated against an allowlist, never interpolated
	 * raw into a regex).
	 */
	private static field(block: string, name: string): string | null {
		if (!ALLOWED_FIELDS.has(name)) return null;
		// `name` is allowlist-validated above, so this static template is safe.
		const re = new RegExp(`\\b${name}\\s+"((?:[^"\\\\]|\\\\.)*)"`, 'im');
		const match = re.exec(block);
		if (!match) return null;
		return match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
	}
}
