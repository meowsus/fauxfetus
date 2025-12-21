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

		for (const trackIndexData of catalog) {
			const [artistSlug, albumSlug, trackSlug] = trackIndexData.trackUri.split('/');

			if (!structuredCatalog[artistSlug]) {
				structuredCatalog[artistSlug] = {};
			}

			if (!structuredCatalog[artistSlug][albumSlug]) {
				structuredCatalog[artistSlug][albumSlug] = {};
			}

			structuredCatalog[artistSlug][albumSlug][trackSlug] = trackIndexData;
		}

		return structuredCatalog;
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
				trackPath: `/artists/${trackIndexData.trackUri}`
			});
		}

		// Sort tracks by trackNumber
		albumIndexData.tracks.sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0));

		return albumIndexData;
	}
}
