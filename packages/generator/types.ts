export interface TrackIndexData {
	trackUri: string;
	artistPath: string;
	albumPath: string;
	artistName: string;
	albumName: string;
	trackName: string;
	trackNumber: number | null;
	audioUrl: string;
}

export type AlbumTrack = Pick<TrackIndexData, 'trackName' | 'trackNumber' | 'audioUrl'> & {
	trackPath: string;
};

export interface AlbumIndexData {
	artistName: string;
	artistPath: string;
	albumName: string;
	tracks: AlbumTrack[];
}

export type ArtistAlbum = Pick<AlbumIndexData, 'albumName'> & {
	albumPath: string;
};

export interface ArtistIndexData {
	artistName: string;
	albums: ArtistAlbum[];
}

export type Artist = Pick<ArtistIndexData, 'artistName'> & {
	artistPath: string;
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
