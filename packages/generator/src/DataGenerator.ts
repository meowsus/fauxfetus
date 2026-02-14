import fs from 'fs-extra';
import klaw from 'klaw';
import { parseBuffer, type IAudioMetadata } from 'music-metadata';
import path from 'path';
import slugify from 'slugify';
import { ValidatorService } from './services/ValidatorService';

const SKIP_DIR_PATTERN = /^_RETIRED/;

export type PathMetadataTuple = [audioUrl: string, metadata: IAudioMetadata];

type MetadataDictionary = {
	[artistName: string]: {
		[albumName: string]: {
			audioUrl: string;
			metadata: IAudioMetadata;
		}[];
	};
};

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
}

export interface Artist {
	slug: string;
	name: string;

	albums: Album[];
}

export enum ApeTag {
	Artist = 'ARTIST',
	Album = 'ALBUM',
	Title = 'TITLE',
	Compilation = 'COMPILATION'
}

const createSlug = (str: string) => slugify(str, { lower: true, strict: true });

const findAPEv2TagValue = (metadata: IAudioMetadata, tagId: ApeTag) => {
	const tag = metadata.native.APEv2.find((tag) => tag.id === tagId);

	if (!tag) throw new Error(`${tagId} not found`);
	if (typeof tag.value !== 'string') throw new Error(`${tagId} not a string`);

	return tag.value;
};

export class DataGenerator {
	private readPath: string = '';
	private writePath: string = '';

	private mp3Metadata: PathMetadataTuple[] = [];
	private compilationsMp3Metadata: PathMetadataTuple[] = [];

	private metadataDictionary: MetadataDictionary = {};
	private catalog: Artist[] = [];

	private validatorService: ValidatorService;

	constructor(readPath: string, writePath: string) {
		this.readPath = readPath;
		this.writePath = writePath;

		this.validatorService = new ValidatorService();
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

	private async buildMp3Metadata(): Promise<void> {
		for await (const file of klaw(this.readPath)) {
			const relativePath = path.relative(this.readPath, file.path);

			if (!relativePath.endsWith('.mp3')) continue;
			if (SKIP_DIR_PATTERN.test(relativePath)) continue;

			const buffer = await fs.readFile(file.path);
			const metadata = await parseBuffer(buffer, { mimeType: 'audio/mpeg' });

			const isCompilation = metadata.native.APEv2.some((item) => item.id === ApeTag.Compilation);

			if (isCompilation) {
				this.compilationsMp3Metadata.push([relativePath, metadata]);
			} else {
				this.mp3Metadata.push([relativePath, metadata]);
			}
		}
	}

	private async validateMp3Metadata(): Promise<void> {
		this.validatorService.run(this.mp3Metadata);
		this.validatorService.run(this.compilationsMp3Metadata);
	}

	private async sortMp3MetadataByPath(): Promise<void> {
		this.mp3Metadata.sort((a, b) => {
			return a[0].localeCompare(b[0]);
		});

		this.compilationsMp3Metadata.sort((a, b) => {
			return a[0].localeCompare(b[0]);
		});
	}

	// We can make assumptions about the presence and typing of data here
	// because this has already been passed through the validator.
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

	// We can make assumptions about the presence and typing of data here
	// because this has already been passed through the validator.
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
				const album: Album = {
					slug: albumSlug,
					name: albumName,
					artistSlug,
					artistName,
					tracks: []
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

	async run(): Promise<void> {
		await this.ensurePathsExist();
		await this.emptyWritePath();
		await this.buildMp3Metadata();
		await this.validateMp3Metadata();
		await this.sortMp3MetadataByPath();
		await this.buildMetadataDictionary();
		await this.backfillCompilations();
		await this.buildCatalog();
		await this.sortCatalog();
		await this.writeCatalogJson();
		await this.writeTracksJson();
	}
}
