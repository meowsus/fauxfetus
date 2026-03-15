import type { IAudioMetadata } from 'music-metadata';
import { z } from 'zod';
import { ApeTag, type PathMetadataTuple } from '../DataGenerator';

class ValidationError extends Error {
	constructor(path: string) {
		super(`ValidationError @ ${path}`);
	}
}

class SchemaValidationError extends ValidationError {
	constructor(path: string, error: z.ZodError) {
		super(`ValidationError @ ${path}\n${z.prettifyError(error)}`);
	}
}

class FormatValidationError extends ValidationError {
	constructor(path: string, message: string) {
		super(`FormatValidationError @ ${path}: ${message}`);
	}
}

class ApeTagValidationError extends ValidationError {
	constructor(path: string, message: string) {
		super(`ApeTagValidationError @ ${path}: ${message}`);
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
			throw new SchemaValidationError(path, result.error);
		}
	}

	private validateFormat(path: string, metadata: IAudioMetadata) {
		const { tagTypes } = metadata.format;

		if (tagTypes[0] !== 'APEv2') {
			throw new FormatValidationError(path, `Wrong tagType (found ${tagTypes[0]})`);
		}
	}

	private validateApeTags(path: string, metadata: IAudioMetadata) {
		const { APEv2 } = metadata.native;

		const album = APEv2.filter((item) => item.id === ApeTag.Album);

		if (!album) {
			throw new ApeTagValidationError(path, 'No album name');
		}

		if (album.length > 1) {
			throw new ApeTagValidationError(path, 'Too many albums');
		}

		if (typeof album[0].value !== 'string') {
			throw new ApeTagValidationError(path, 'Album name not a string');
		}

		const artist = APEv2.filter((item) => item.id === ApeTag.Artist);

		if (!artist) {
			throw new ApeTagValidationError(path, 'No artist name');
		}

		if (artist.length > 1) {
			throw new ApeTagValidationError(path, 'Too many artists');
		}

		if (typeof artist[0].value !== 'string') {
			throw new ApeTagValidationError(path, 'Artist name not a string');
		}

		const title = APEv2.filter((item) => item.id === ApeTag.Title);

		if (!title) {
			throw new ApeTagValidationError(path, 'Not track title');
		}

		if (title.length > 1) {
			throw new ApeTagValidationError(path, 'Too many track titles');
		}

		if (typeof title[0].value !== 'string') {
			throw new ApeTagValidationError(path, 'Track title not a string');
		}

		const compilation = APEv2.filter((item) => item.id === ApeTag.Compilation);

		if (compilation.length > 1) {
			throw new ApeTagValidationError(path, 'Too many compilation entries');
		} else if (compilation.length === 1 && typeof compilation[0].value !== 'string') {
			throw new ApeTagValidationError(path, 'Compilation value not a string');
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
