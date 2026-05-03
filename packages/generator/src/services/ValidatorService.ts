import type { IAudioMetadata } from 'music-metadata';
import { inspect } from 'util';
import { z } from 'zod';
import { ApeTag, type PathMetadataTuple } from '../DataGenerator';

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

export class ValidatorService {
	private validateSchema(path: string, metadata: IAudioMetadata) {
		const result = ValidMetadataSchema.safeParse(metadata);

		if (!result.success) {
			throw new SchemaValidationError(path, result.error, metadata);
		}
	}

	private validateFormat(path: string, metadata: IAudioMetadata) {
		const { tagTypes } = metadata.format;

		if (tagTypes[0] !== 'APEv2') {
			throw new FormatValidationError(path, `Wrong tagType (found ${tagTypes[0]})`, tagTypes);
		}
	}

	private validateApeTags(path: string, metadata: IAudioMetadata) {
		const { APEv2 } = metadata.native;

		const album = APEv2.filter((item) => item.id === ApeTag.Album);

		if (!album) {
			throw new ApeTagValidationError(path, 'No album name', APEv2);
		}

		if (album.length > 1) {
			throw new ApeTagValidationError(path, 'Too many albums', APEv2);
		}

		if (typeof album[0].value !== 'string') {
			throw new ApeTagValidationError(path, 'Album name not a string', APEv2);
		}

		const artist = APEv2.filter((item) => item.id === ApeTag.Artist);

		if (!artist) {
			throw new ApeTagValidationError(path, 'No artist name', APEv2);
		}

		if (artist.length > 1) {
			throw new ApeTagValidationError(path, 'Too many artists', APEv2);
		}

		if (typeof artist[0].value !== 'string') {
			throw new ApeTagValidationError(path, 'Artist name not a string', APEv2);
		}

		const title = APEv2.filter((item) => item.id === ApeTag.Title);

		if (!title) {
			throw new ApeTagValidationError(path, 'Not track title', APEv2);
		}

		if (title.length > 1) {
			throw new ApeTagValidationError(path, 'Too many track titles', APEv2);
		}

		if (typeof title[0].value !== 'string') {
			throw new ApeTagValidationError(path, 'Track title not a string', APEv2);
		}

		const compilation = APEv2.filter((item) => item.id === ApeTag.Compilation);

		if (compilation.length > 1) {
			throw new ApeTagValidationError(path, 'Too many compilation entries', APEv2);
		} else if (compilation.length === 1 && typeof compilation[0].value !== 'string') {
			throw new ApeTagValidationError(path, 'Compilation value not a string', APEv2);
		}
	}

	public run(data: PathMetadataTuple[]) {
		for (const [path, metadata] of data) {
			this.validateSchema(path, metadata);
			this.validateFormat(path, metadata);
			this.validateApeTags(path, metadata);
		}
	}
}
