import {
	ApeTag,
	Validator,
	type IAudioMetadata,
	type PathMetadataTuple
} from '@fauxfetus/validator';
import fs from 'fs-extra';
import path from 'path';
import slugify from 'slugify';

export type { PathMetadataTuple };

export type Recommendations = Record<string, string[]>;

export interface Track {
	slug: string;
	name: string;
	number: number | null;

	artistSlug: string;
	artistName: string;
	albumSlug: string;
	albumName: string;

	isCompilation: boolean;

	audioUrl: string;
	metadata?: IAudioMetadata;
}

export interface Album {
	slug: string;
	name: string;

	artistSlug: string;
	artistName: string;

	tracks: Track[];

	isCompilation: boolean;
}

export interface Artist {
	slug: string;
	name: string;

	albums: Album[];
}

const createSlug = (str: string) => slugify(str, { lower: true, strict: true });

/**
 * Look up an APEv2 tag value in a metadata block.
 *
 * Throws if the tag is missing or its value isn't a string. This is treated
 * as an *invariant* by the rest of this module: the validator's
 * `validateApeTags` check has already guaranteed the tag exists and is a
 * string before we get here, so any throw is a real bug (validation
 * regressed or was bypassed), not a user-facing validation error.
 */
const findAPEv2TagValue = (metadata: IAudioMetadata, tagId: ApeTag): string => {
	const tag = metadata.native.APEv2.find((tag) => tag.id === tagId);

	if (!tag) throw new Error(`Invariant violated: ${tagId} tag missing after validation`);
	if (typeof tag.value !== 'string') {
		throw new Error(`Invariant violated: ${tagId} value is not a string after validation`);
	}

	return tag.value;
};

export class DataGenerator {
	private readPath: string = '';
	private writePath: string = '';

	private mp3Metadata: PathMetadataTuple[] = [];
	private compilationsMp3Metadata: PathMetadataTuple[] = [];

	private metadataDictionary: MetadataDictionary = {};
	private catalog: Artist[] = [];

	private constructor(readPath: string, writePath: string) {
		this.readPath = readPath;
		this.writePath = writePath;
	}

	/**
	 * Build a DataGenerator. The audio directory at `readPath` is validated
	 * as a prerequisite — if any file is malformed, the full failure report
	 * is printed and an error is thrown before any instance is returned.
	 * Use this instead of `new DataGenerator(...)` (the constructor is
	 * private) so the prerequisite check is unavoidable.
	 */
	static async create(readPath: string, writePath: string): Promise<DataGenerator> {
		const { tuples, summary } = await Validator.readAndValidate(readPath);

		if (summary.failures.length > 0) {
			Validator.printReport(summary, readPath);

			const fileCount = new Set(summary.failures.map((f) => f.path)).size;
			throw new Error(
				`Cannot generate data: ${summary.failures.length} validation error(s) across ${fileCount} file(s). ` +
					`Run \`pnpm data:validate\` for full details.`
			);
		}

		const generator = new DataGenerator(readPath, writePath);

		// Partition the validated tuples. Safe to read APEv2 directly here
		// because the validator already verified the structure.
		for (const [relativePath, metadata] of tuples) {
			const isCompilation = metadata.native.APEv2.some((item) => item.id === ApeTag.Compilation);
			(isCompilation ? generator.compilationsMp3Metadata : generator.mp3Metadata).push([
				relativePath,
				metadata
			]);
		}

		return generator;
	}

	/** Build a Track from validated metadata. Single place for IAudioMetadata → Track. */
	private metadataToTrack(
		audioUrl: string,
		metadata: IAudioMetadata,
		omitMetadata: boolean = false
	): Track {
		const trackName = findAPEv2TagValue(metadata, ApeTag.Title);
		const artistName = findAPEv2TagValue(metadata, ApeTag.Artist);
		const albumName = findAPEv2TagValue(metadata, ApeTag.Album);
		const isCompilation = !!metadata.native.APEv2.find((tag) => tag.id === ApeTag.Compilation)
			?.value;

		const track: Track = {
			slug: createSlug(trackName),
			name: trackName,
			number: metadata.common.track.no,

			artistSlug: createSlug(artistName),
			artistName,
			albumSlug: createSlug(albumName),
			albumName,

			isCompilation,

			audioUrl
		};

		if (omitMetadata) {
			return track;
		}

		track.metadata = metadata;

		return track;
	}

	private async ensurePathsExist(): Promise<void> {
		try {
			await fs.ensureDir(this.readPath);
			await fs.ensureDir(this.writePath);
		} catch (error) {
			console.error('Error ensuring directory:', error);
			process.exit(1);
		}
	}

	private async emptyWritePath(): Promise<void> {
		await fs.emptyDir(this.writePath);
	}

	private async sortMp3MetadataByPath(): Promise<void> {
		this.mp3Metadata.sort((a, b) => {
			return a[0].localeCompare(b[0]);
		});

		this.compilationsMp3Metadata.sort((a, b) => {
			return a[0].localeCompare(b[0]);
		});
	}

	// Safe to assume APEv2 tags are well-formed here — the validator's
	// prerequisite check has already guaranteed it.
	private async buildMetadataDictionary(): Promise<void> {
		for (const [audioUrl, metadata] of this.mp3Metadata) {
			const artistName = findAPEv2TagValue(metadata, ApeTag.Artist);

			if (!this.metadataDictionary[artistName]) {
				this.metadataDictionary[artistName] = {};
			}

			const albumName = findAPEv2TagValue(metadata, ApeTag.Album);

			if (!this.metadataDictionary[artistName][albumName]) {
				this.metadataDictionary[artistName][albumName] = [];
			}

			this.metadataDictionary[artistName][albumName].push({
				audioUrl,
				metadata
			});
		}
	}

	// Safe to assume APEv2 tags are well-formed here — see buildMetadataDictionary.
	private async backfillCompilations(): Promise<void> {
		//  First, we group our array of compilation tuples by the *globally unique* compilation
		//  name, so that we can access the metadata per grouping individually
		const tuplesByCompilationName: { [compilationName: string]: PathMetadataTuple[] } = {};

		for (const [path, metadata] of this.compilationsMp3Metadata) {
			const compilationName = findAPEv2TagValue(metadata, ApeTag.Compilation);

			if (!tuplesByCompilationName[compilationName]) {
				tuplesByCompilationName[compilationName] = [];
			}

			tuplesByCompilationName[compilationName].push([path, metadata]);
		}

		// Next, we iterate over each of the sets of groupings
		for (const tuples of Object.values(tuplesByCompilationName)) {
			const artistNames = new Set<string>();

			// ...And the metadata therein, to collect each artist assigned to the grouping.
			for (const [, metadata] of tuples) {
				const artistName = findAPEv2TagValue(metadata, ApeTag.Artist);

				artistNames.add(artistName);
			}

			// After the artists are gathered, we iterate over the grouping again
			for (const [audioUrl, metadata] of tuples) {
				// ...Before iterating over the artists present in the grouping to augment
				// the existent navigable catalog which may or may not contain some of the data.
				// The purpose of this is to be able to completely duplicate the album's track
				// listing across any number of artists present in the grouping.
				for (const artistName of artistNames) {
					if (!this.metadataDictionary[artistName]) {
						this.metadataDictionary[artistName] = {};
					}

					const albumName = findAPEv2TagValue(metadata, ApeTag.Album);

					if (!this.metadataDictionary[artistName][albumName]) {
						this.metadataDictionary[artistName][albumName] = [];
					}

					this.metadataDictionary[artistName][albumName].push({
						audioUrl,
						metadata
					});
				}
			}
		}
	}

	/**
	 * We build the catalog from the compiled metadata dictionary.
	 */
	private async buildCatalog(): Promise<void> {
		for (const [artistName, albumData] of Object.entries(this.metadataDictionary)) {
			const artistSlug = createSlug(artistName);
			const artist: Artist = {
				slug: artistSlug,
				name: artistName,
				albums: []
			};

			for (const [albumName, trackData] of Object.entries(albumData)) {
				const albumSlug = createSlug(albumName);

				const isCompilation = trackData.some((track) =>
					track.metadata?.native.APEv2.some((tag) => tag.id === ApeTag.Compilation)
				);

				const album: Album = {
					slug: albumSlug,
					name: albumName,
					artistSlug,
					artistName,
					tracks: [],
					isCompilation
				};

				for (const { audioUrl, metadata } of trackData) {
					album.tracks.push(this.metadataToTrack(audioUrl, metadata));
				}

				artist.albums.push(album);
			}

			this.catalog.push(artist);
		}
	}

	private async sortCatalog(): Promise<void> {
		// Sort artists by name
		this.catalog.sort((a, b) => {
			const nameA = a.name.replace(/^The\s+/i, '');
			const nameB = b.name.replace(/^The\s+/i, '');

			return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
		});

		for (const artist of this.catalog) {
			// Sort albums by name
			artist.albums.sort((a, b) =>
				a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
			);

			for (const album of artist.albums) {
				// Sort tracks by track number
				album.tracks.sort((a, b) => {
					if (a.number === null && b.number === null) return 0;
					if (a.number === null) return 1;
					if (b.number === null) return -1;

					return a.number - b.number;
				});
			}
		}
	}

	private async writeCatalogJson(): Promise<void> {
		await fs.writeJson(path.join(this.writePath, 'catalog.json'), this.catalog);
	}

	private async writeTracksJson(): Promise<void> {
		const tracks = [...this.mp3Metadata, ...this.compilationsMp3Metadata].map(
			([audioUrl, metadata]) => this.metadataToTrack(audioUrl, metadata, true)
		);

		await fs.writeJson(path.join(this.writePath, 'tracks.json'), tracks);
	}

	/**
	 * Build the per-artist composer set from the catalog. Compilation-album
	 * tracks are excluded because their COMPOSER values are one-off cross-
	 * artist credits, not "band members" of any single artist. The literal
	 * 'Unknown' (case-insensitive) is filtered out as a placeholder for
	 * members whose name wasn't recorded. The set is normalized to a sorted
	 * array for stable, deterministic output.
	 */
	private buildComposerSets(): Map<string, string[]> {
		const sets = new Map<string, string[]>();
		const isUnknown = (name: string) => name.trim().toLowerCase() === 'unknown';

		for (const artist of this.catalog) {
			const composers = new Set<string>();

			for (const album of artist.albums) {
				if (album.isCompilation) continue;

				for (const track of album.tracks) {
					const apeTags = track.metadata?.native.APEv2 ?? [];
					for (const tag of apeTags) {
						if (tag.id !== 'COMPOSER') continue;
						if (typeof tag.value !== 'string') continue;
						if (isUnknown(tag.value)) continue;
						composers.add(tag.value);
					}
				}
			}

			sets.set(artist.slug, [...composers].sort());
		}

		return sets;
	}

	/**
	 * Build the recommendations graph. For each artist, recommend other
	 * artists ordered by:
	 *   1. sharedCount desc — size of the COMPOSER intersection
	 *   2. extrasCount asc — how many extra composers the candidate has
	 *      (so an exact-member match outranks a superset)
	 *   3. artistSlug asc — deterministic tiebreaker
	 * Self-recommendations and zero-overlap candidates are omitted.
	 */
	private buildRecommendations(composerSets: Map<string, string[]>): Recommendations {
		const graph: Recommendations = {};

		for (const [sourceSlug, sourceComposers] of composerSets) {
			const sourceSet = new Set(sourceComposers);

			if (sourceSet.size === 0) {
				graph[sourceSlug] = [];
				continue;
			}

			const candidates: {
				artistSlug: string;
				sharedCount: number;
				extrasCount: number;
				shared: string[];
			}[] = [];

			for (const [candidateSlug, candidateComposers] of composerSets) {
				if (candidateSlug === sourceSlug) continue;
				if (candidateComposers.length === 0) continue;

				const candidateSet = new Set(candidateComposers);
				const shared: string[] = [];
				for (const name of candidateComposers) {
					if (sourceSet.has(name)) shared.push(name);
				}
				if (shared.length === 0) continue;

				candidates.push({
					artistSlug: candidateSlug,
					sharedCount: shared.length,
					extrasCount: candidateSet.size - shared.length,
					shared: shared.sort()
				});
			}

			candidates.sort((a, b) => {
				if (b.sharedCount !== a.sharedCount) return b.sharedCount - a.sharedCount;
				if (a.extrasCount !== b.extrasCount) return a.extrasCount - b.extrasCount;
				return a.artistSlug.localeCompare(b.artistSlug);
			});

			graph[sourceSlug] = candidates.map((c) => c.artistSlug);
		}

		return graph;
	}

	private async writeRecommendationsJson(): Promise<void> {
		const composerSets = this.buildComposerSets();
		const graph = this.buildRecommendations(composerSets);

		await fs.writeJson(path.join(this.writePath, 'recommendations.json'), graph);
	}

	async run(): Promise<void> {
		await this.ensurePathsExist();
		await this.emptyWritePath();
		await this.sortMp3MetadataByPath();
		await this.buildMetadataDictionary();
		await this.backfillCompilations();
		await this.buildCatalog();
		await this.sortCatalog();
		await this.writeCatalogJson();
		await this.writeTracksJson();
		await this.writeRecommendationsJson();
	}
}

type MetadataDictionary = {
	[artistName: string]: {
		[albumName: string]: {
			audioUrl: string;
			metadata: IAudioMetadata;
		}[];
	};
};
