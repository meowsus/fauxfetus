export type TrackUri = `${string}/${string}/${string}`;

export type ArtistPath = `/artists/${string}`;
export type AlbumPath = `/artists/${string}/${string}`;
export type TrackPath = `/artists/${string}/${string}/${string}`;

export interface TrackIndexData {
	trackUri: TrackUri;
	artistPath: ArtistPath;
	albumPath: AlbumPath;
	artistName: string;
	albumName: string;
	trackName: string;
	trackNumber: number | null;
	audioUrl: string;
}

export type AlbumTrack = Pick<TrackIndexData, 'trackName' | 'trackNumber' | 'audioUrl'> & {
	trackPath: TrackPath;
};

export interface AlbumIndexData {
	artistName: string;
	artistPath: ArtistPath;
	albumName: string;
	tracks: AlbumTrack[];
}

export type ArtistAlbum = Pick<AlbumIndexData, 'albumName'> & {
	albumPath: AlbumPath;
};

export interface ArtistIndexData {
	artistName: string;
	albums: ArtistAlbum[];
}

export type Artist = Pick<ArtistIndexData, 'artistName'> & {
	artistPath: ArtistPath;
};

export type ArtistsIndexData = Artist[];

export type Catalog = TrackIndexData[];

export type StructuredCatalog = {
	[artistSlug: string]: {
		[albumSlug: string]: {
			[trackSlug: string]: TrackIndexData;
		};
	};
};
