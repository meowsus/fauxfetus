import type { Catalog, StructuredCatalog, TrackUri } from '../types';
import { CatalogService } from './services/CatalogService';
import { FileSystemService } from './services/FileSystemService';
import { MetadataService } from './services/MetadataService';

export default class DataGenerator {
	private fileSystemService: FileSystemService;
	private metadataService: MetadataService;
	private catalogService: CatalogService;

	private trackUris: TrackUri[] = [];
	private catalog: Catalog = [];
	private structuredCatalog: StructuredCatalog = {};

	private readPath: string = '';
	private writePath: string = '';

	constructor(readPath: string, writePath: string) {
		this.readPath = readPath;
		this.writePath = writePath;

		this.fileSystemService = new FileSystemService();
		this.metadataService = new MetadataService();
		this.catalogService = new CatalogService();
	}

	private async buildTrackUris(): Promise<void> {
		console.log('Building track URI list...');
		this.trackUris = await this.fileSystemService.getTrackUris(this.readPath);
		console.log(`Finished building audio file list: ${this.trackUris.length} entries`);
	}

	private async buildCatalog(): Promise<void> {
		console.log('Building catalog...');

		for (const trackUri of this.trackUris) {
			const mp3Path = `${this.readPath}/${trackUri}.mp3`;
			const buffer = await this.fileSystemService.readMp3File(mp3Path);
			const metadata = await this.metadataService.parseAudioBuffer(buffer);
			const trackIndexData = this.metadataService.extractTrackIndexData(trackUri, metadata);
			this.catalog.push(trackIndexData);
		}

		console.log('Built catalog');
	}

	private async buildStructuredCatalog(): Promise<void> {
		console.log('Building structured catalog...');
		this.structuredCatalog = this.catalogService.buildStructuredCatalog(this.catalog);
		console.log('Built structured catalog');
	}

	private async createDataDirectory(): Promise<void> {
		console.log('Creating data directory...');

		await this.fileSystemService.emptyDirectory(this.writePath);

		// Process each artist
		for (const artistSlug of Object.keys(this.structuredCatalog)) {
			// Create artist directory first
			const artistDirPath = `${this.writePath}/${artistSlug}`;
			await this.fileSystemService.createDirectory(artistDirPath);

			// Build and write artist data
			const artistIndexData = this.catalogService.buildArtistIndexData(
				artistSlug,
				this.structuredCatalog
			);
			const artistIndexFilePath = `${artistDirPath}/index.json`;
			await this.fileSystemService.writeJsonFile(artistIndexFilePath, artistIndexData);

			// Process each album for this artist
			for (const albumSlug of Object.keys(this.structuredCatalog[artistSlug])) {
				// Create album directory
				const albumDirPath = `${artistDirPath}/${albumSlug}`;
				await this.fileSystemService.createDirectory(albumDirPath);

				// Build and write album data
				const albumIndexData = this.catalogService.buildAlbumIndexData(
					artistSlug,
					albumSlug,
					this.structuredCatalog
				);
				const albumIndexFilePath = `${albumDirPath}/index.json`;
				await this.fileSystemService.writeJsonFile(albumIndexFilePath, albumIndexData);

				// Process each track for this album
				for (const trackSlug of Object.keys(this.structuredCatalog[artistSlug][albumSlug])) {
					const trackIndexData = this.structuredCatalog[artistSlug][albumSlug][trackSlug];

					// Create track directory and write track data
					const trackDirPath = `${this.writePath}/${trackIndexData.trackUri}`;
					await this.fileSystemService.createDirectory(trackDirPath);
					const trackIndexFilePath = `${trackDirPath}/index.json`;
					await this.fileSystemService.writeJsonFile(trackIndexFilePath, trackIndexData);
				}
			}
		}

		// Write artists index file
		const artistsIndexData = this.catalogService.buildArtistsIndexData(this.structuredCatalog);
		const artistsIndexFilePath = `${this.writePath}/index.json`;
		await this.fileSystemService.writeJsonFile(artistsIndexFilePath, artistsIndexData);

		console.log('Created data directory');
	}

	private async ensurePathsExist(): Promise<void> {
		try {
			await this.fileSystemService.ensureDirectoryExists(this.readPath);
			await this.fileSystemService.ensureDirectoryExists(this.writePath);
		} catch (error) {
			console.error('Error ensuring directory:', error);
			process.exit(1);
		}
	}

	async run(): Promise<void> {
		await this.ensurePathsExist();
		await this.buildTrackUris();
		await this.buildCatalog();
		await this.buildStructuredCatalog();
		await this.createDataDirectory();
	}
}
