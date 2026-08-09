import type { IAudioMetadata } from 'music-metadata';
import { inspect } from 'util';
import { z } from 'zod';
import type { PathMetadataTuple } from './types';
import { readAudioMetadata } from './walk';

export interface ValidationFailure {
	path: string;
	error: Error;
}

export interface ValidationSummary {
	checked: number;
	failures: ValidationFailure[];
}

const stringify = (value: unknown) =>
	inspect(value, { depth: 3, colors: false, maxArrayLength: 50, maxStringLength: 500 });

class ValidationError extends Error {
	constructor(path: string, message: string, context?: unknown) {
		const suffix = context !== undefined ? `\n\nRelevant data:\n${stringify(context)}` : '';
		super(`${path}\n${message}${suffix}`);
	}
}

class SchemaValidationError extends ValidationError {
	constructor(path: string, error: z.ZodError, metadata: IAudioMetadata) {
		super(path, `Schema validation failed:\n${z.prettifyError(error)}`, {
			format: metadata.format,
			quality: metadata.quality,
			native: metadata.native
		});
	}
}

class FormatValidationError extends ValidationError {
	constructor(path: string, message: string, tagTypes: string[]) {
		super(path, `Format validation failed: ${message}`, tagTypes);
	}
}

class ApeTagValidationError extends ValidationError {
	constructor(path: string, message: string, apeTags: unknown[]) {
		super(path, `Tag validation failed: ${message}`, apeTags);
	}
}

const ValidMetadataSchema = z.object({
	format: z.object({
		tagTypes: z.array(z.string()).length(1)
	}),
	quality: z.object({
		warnings: z.array(z.any()).length(0)
	}),
	native: z.object({
		APEv2: z.array(
			z.object({
				id: z.string(),
				value: z.union([
					z.string(),
					// Embedded cover art
					z.object({
						description: z.string(),
						data: z.instanceof(Uint8Array)
					})
				])
			})
		)
	})
});

export class Validator {
	private readPath: string = '';

	constructor(readPath: string) {
		this.readPath = readPath;
	}

	/**
	 * Walk the audio directory, parse metadata, and run the full validator.
	 * Collects every failure across every file (does not throw on first
	 * error). Returns `{ checked, failures }`.
	 */
	async run(): Promise<ValidationSummary> {
		const tuples = await readAudioMetadata(this.readPath);
		return Validator.validate(tuples);
	}

	/**
	 * Walk the audio directory, parse metadata, and run validation — all in
	 * one IO pass. Returns the walked tuples *and* a `ValidationSummary` so
	 * callers that are about to do something with the metadata (e.g. the
	 * data generator) can avoid a second walk. Never throws.
	 */
	static async readAndValidate(
		readPath: string
	): Promise<{ tuples: PathMetadataTuple[]; summary: ValidationSummary }> {
		const tuples = await readAudioMetadata(readPath);
		const summary = Validator.validate(tuples);
		return { tuples, summary };
	}

	/**
	 * Validate pre-walked `path/metadata` tuples. Useful for callers that
	 * already have the metadata in hand (e.g. `DataGenerator`) and want to
	 * run the same checks without re-walking the directory.
	 *
	 * Collects every failure across every file. Never throws — callers that
	 * want a hard fail-fast gate should `throw summary.failures[0].error`
	 * themselves.
	 */
	static validate(tuples: PathMetadataTuple[]): ValidationSummary {
		const failures: ValidationFailure[] = [];

		for (const [path, metadata] of tuples) {
			for (const check of [
				Validator.validateSchema,
				Validator.validateFormat,
				Validator.validateApeTags
			]) {
				try {
					check(path, metadata);
				} catch (error) {
					failures.push({
						path,
						error: error instanceof Error ? error : new Error(String(error))
					});
				}
			}
		}

		return { checked: tuples.length, failures };
	}

	private static validateSchema(path: string, metadata: IAudioMetadata): void {
		const result = ValidMetadataSchema.safeParse(metadata);

		if (!result.success) {
			throw new SchemaValidationError(path, result.error, metadata);
		}
	}

	private static validateFormat(path: string, metadata: IAudioMetadata): void {
		const { tagTypes } = metadata.format;

		if (tagTypes[0] !== 'APEv2') {
			throw new FormatValidationError(path, `Wrong tagType (found ${tagTypes[0]})`, tagTypes);
		}
	}

	private static validateApeTags(path: string, metadata: IAudioMetadata): void {
		// The Zod schema in `validateSchema` declares `APEv2` as a required
		// array, so this branch is structurally unreachable when both
		// checks run in order. Guard anyway: a malformed file may slip
		// through if the schema ever loosens, and a clear validation error
		// is better than a `Cannot read properties of undefined` crash.
		const tags = metadata.native.APEv2;
		if (!Array.isArray(tags)) {
			throw new ApeTagValidationError(path, 'APEv2 tags missing or malformed', []);
		}

		const album = tags.filter((item) => item.id === 'ALBUM');

		if (!album) {
			throw new ApeTagValidationError(path, 'No album name', tags);
		}

		if (album.length > 1) {
			throw new ApeTagValidationError(path, 'Too many albums', tags);
		}

		if (typeof album[0].value !== 'string') {
			throw new ApeTagValidationError(path, 'Album name not a string', tags);
		}

		const artist = tags.filter((item) => item.id === 'ARTIST');

		if (!artist) {
			throw new ApeTagValidationError(path, 'No artist name', tags);
		}

		if (artist.length > 1) {
			throw new ApeTagValidationError(path, 'Too many artists', tags);
		}

		if (typeof artist[0].value !== 'string') {
			throw new ApeTagValidationError(path, 'Artist name not a string', tags);
		}

		const title = tags.filter((item) => item.id === 'TITLE');

		if (!title) {
			throw new ApeTagValidationError(path, 'Not track title', tags);
		}

		if (title.length > 1) {
			throw new ApeTagValidationError(path, 'Too many track titles', tags);
		}

		if (typeof title[0].value !== 'string') {
			throw new ApeTagValidationError(path, 'Track title not a string', tags);
		}

		const compilation = tags.filter((item) => item.id === 'COMPILATION');

		if (compilation.length > 1) {
			throw new ApeTagValidationError(path, 'Too many compilation entries', tags);
		} else if (compilation.length === 1 && typeof compilation[0].value !== 'string') {
			throw new ApeTagValidationError(path, 'Compilation value not a string', tags);
		}

		const composer = tags.filter((item) => item.id === 'COMPOSER');

		if (composer.length === 0) {
			throw new ApeTagValidationError(path, 'No composer', tags);
		}

		for (const item of composer) {
			if (typeof item.value !== 'string') {
				throw new ApeTagValidationError(path, 'Composer not a string', tags);
			}
		}
	}

	/**
	 * Pretty-print a `ValidationSummary` to the console. Use `console.log`
	 * for the success path and `console.error` for the failure path so the
	 * latter is easy to redirect to logs.
	 *
	 * `readPath` is only used to format the "no files found" message; pass
	 * it when `summary.checked === 0` and you want a helpful context line,
	 * otherwise it can be omitted.
	 */
	static printReport(summary: ValidationSummary, readPath?: string, out: Console = console): void {
		const { checked, failures } = summary;

		if (checked === 0) {
			out.log(`No .mp3 files found in ${readPath ?? '(unknown path)'} — nothing to validate.`);
			return;
		}

		if (failures.length === 0) {
			out.log(`✓ Validated ${checked} track${checked === 1 ? '' : 's'}.`);
			return;
		}

		const grouped = new Map<string, Error[]>();
		for (const { path: filePath, error } of failures) {
			if (!grouped.has(filePath)) grouped.set(filePath, []);
			grouped.get(filePath)!.push(error);
		}

		out.error(
			`✗ Found ${failures.length} error${failures.length === 1 ? '' : 's'} across ${grouped.size} file${grouped.size === 1 ? '' : 's'}:`
		);
		for (const [filePath, fileErrors] of grouped) {
			out.error(`\n  ${filePath}`);
			for (const error of fileErrors) {
				// `ValidationError` prepends the file path as the first line of
				// `error.message`, but we already print it as the group header
				// above — drop the duplicate so it doesn't eat the line budget.
				// Without this, `Schema validation failed:` would be the only line
				// shown and the actual Zod error (which lives on the *next* line)
				// would be cut off, producing a blank-looking report.
				const lines = error.message.split('\n');
				if (lines[0] === filePath) lines.shift();
				const message = lines.join('\n    ');
				out.error(`    - ${message}`);
			}
		}
	}

	/**
	 * Instance convenience wrapper. Forwards to the static `printReport`
	 * with this validator's readPath.
	 */
	printReport(summary: ValidationSummary, out: Console = console): void {
		Validator.printReport(summary, this.readPath, out);
	}
}
