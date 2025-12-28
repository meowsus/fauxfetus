import type {
	AlbumIndexData,
	ArtistIndexData,
	ArtistsIndexData,
	Catalog,
	StructuredCatalog
} from '../../types';

export class CatalogService {
	buildStructuredCatalog(catalog: Catalog): StructuredCatalog {
		const structuredCatalog: StructuredCatalog = {};
		const artistsByAlbumSlugMap: Map<string, Set<string>> = new Map();

		for (const trackIndexData of catalog) {
			const [artistSlug, albumSlug, trackSlug] = this.discoverSlugs(trackIndexData.trackUri);

			// Handle special tracks that may belong to multiple artists
			if (trackIndexData.trackUri.startsWith('_')) {
				if (!artistsByAlbumSlugMap.has(albumSlug)) {
					artistsByAlbumSlugMap.set(albumSlug, new Set());
				}

				artistsByAlbumSlugMap.get(albumSlug)?.add(artistSlug);
			}

			if (!structuredCatalog[artistSlug]) {
				structuredCatalog[artistSlug] = {};
			}

			if (!structuredCatalog[artistSlug][albumSlug]) {
				structuredCatalog[artistSlug][albumSlug] = {};
			}

			structuredCatalog[artistSlug][albumSlug][trackSlug] = trackIndexData;
		}

		// // Merge tracks for albums with multiple artists
		// for (const [albumSlug, artistSlugs] of artistsByAlbumSlugMap.entries()) {
		// 	for (const artistSlug of artistSlugs) {
		// 		structuredCatalog[artistSlug][albumSlug] = Array.from(artistSlugs).reduce(
		// 			(acc, artistSlug) => ({
		// 				...acc,
		// 				...structuredCatalog[artistSlug][albumSlug]
		// 			}),
		// 			{}
		// 		);
		// 	}
		// }

		return structuredCatalog;
	}

	/**
	 * Extracts artist and album slugs from a track URI.
	 * Handles both regular and special track formats.
	 * Regular track format: `artist-slug/album-slug/track-slug`
	 * Special track format: `_<TYPE>/album-slug/track-number_artist-slug_track-name`
	 *
	 * @param trackUri
	 * @returns [artistSlug, albumSlug, trackSlug]
	 */
	private discoverSlugs(trackUri: string): [string, string, string] {
		const uriChunks = trackUri.split('/');

		if (!trackUri.startsWith('_')) {
			return [uriChunks[0], uriChunks[1], uriChunks[2]];
		}

		const trackSlug = uriChunks[2];
		const trackChunks = trackSlug.split('_');

		return [trackChunks[1], uriChunks[1], trackSlug];
	}

	buildArtistsIndexData(structuredCatalog: StructuredCatalog): ArtistsIndexData {
		const artistsIndexData: ArtistsIndexData = [];

		for (const artistSlug of Object.keys(structuredCatalog)) {
			const artistIndexData: ArtistIndexData = {
				artistName: '',
				albums: []
			};

			// Get artist name from first album's first track
			const firstAlbumSlug = Object.keys(structuredCatalog[artistSlug])[0];
			const firstTrackSlug = Object.keys(structuredCatalog[artistSlug][firstAlbumSlug])[0];
			const firstTrack = structuredCatalog[artistSlug][firstAlbumSlug][firstTrackSlug];

			artistIndexData.artistName = firstTrack.artistName;

			// Build albums data
			for (const albumSlug of Object.keys(structuredCatalog[artistSlug])) {
				// Get the first track of THIS specific album, not the first track from the first album
				const albumFirstTrackSlug = Object.keys(structuredCatalog[artistSlug][albumSlug])[0];
				artistIndexData.albums.push({
					albumName: structuredCatalog[artistSlug][albumSlug][albumFirstTrackSlug].albumName,
					albumPath: `/artists/${artistSlug}/${albumSlug}`
				});
			}

			artistsIndexData.push({
				artistName: artistIndexData.artistName,
				artistPath: `/artists/${artistSlug}`
			});
		}

		// Sort artists by name
		artistsIndexData.sort((a, b) => {
			const nameA = a.artistName.replace(/^The\s+/i, '');
			const nameB = b.artistName.replace(/^The\s+/i, '');
			return nameA.localeCompare(nameB);
		});

		return artistsIndexData;
	}

	buildArtistIndexData(artistSlug: string, structuredCatalog: StructuredCatalog): ArtistIndexData {
		const artistIndexData: ArtistIndexData = {
			artistName: '',
			albums: []
		};

		for (const albumSlug of Object.keys(structuredCatalog[artistSlug])) {
			const albumTracks = structuredCatalog[artistSlug][albumSlug];
			const firstTrackSlug = Object.keys(albumTracks)[0];
			const firstTrack = albumTracks[firstTrackSlug];

			if (artistIndexData.artistName === '') {
				artistIndexData.artistName = firstTrack.artistName;
			}

			artistIndexData.albums.push({
				albumName: firstTrack.albumName,
				albumPath: `/artists/${artistSlug}/${albumSlug}`
			});
		}

		// Sort albums by name
		artistIndexData.albums.sort((a, b) => a.albumName.localeCompare(b.albumName));

		return artistIndexData;
	}

	buildAlbumIndexData(
		artistSlug: string,
		albumSlug: string,
		structuredCatalog: StructuredCatalog
	): AlbumIndexData {
		const albumTracks = structuredCatalog[artistSlug][albumSlug];
		const firstTrackSlug = Object.keys(albumTracks)[0];
		const firstTrack = albumTracks[firstTrackSlug];

		const albumIndexData: AlbumIndexData = {
			artistName: firstTrack.artistName,
			artistPath: firstTrack.artistPath,
			albumName: firstTrack.albumName,
			tracks: []
		};

		for (const trackSlug of Object.keys(structuredCatalog[artistSlug][albumSlug])) {
			const trackIndexData = structuredCatalog[artistSlug][albumSlug][trackSlug];

			albumIndexData.tracks.push({
				trackName: trackIndexData.trackName,
				trackNumber: trackIndexData.trackNumber,
				audioUrl: trackIndexData.audioUrl,
				trackPath: `/artists/${artistSlug}/${albumSlug}/${trackSlug}`
			});
		}

		// Sort tracks by trackNumber
		albumIndexData.tracks.sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0));

		return albumIndexData;
	}
}
