// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}

		interface TrackIndex {
			trackUri: string;
			artistPath: string;
			albumPath: string;
			artistName: string;
			albumName: string;
			trackName: string;
			trackNumber: number | null;
			audioUrl: string;
		}

		type AlbumTrack = Pick<TrackIndexData, 'trackName' | 'trackNumber' | 'audioUrl'> & {
			trackPath: string;
		};

		interface AlbumIndex {
			artistName: string;
			artistPath: string;
			albumName: string;
			tracks: AlbumTrack[];
		}

		type ArtistAlbum = Pick<AlbumIndexData, 'albumName'> & {
			albumPath: string;
		};

		interface ArtistIndex {
			artistName: string;
			albums: ArtistAlbum[];
		}

		type Artist = Pick<ArtistIndexData, 'artistName'> & {
			artistPath: string;
		};

		type ArtistsIndex = Artist[];

		type Catalog = TrackIndex[];

		type StructuredCatalog = { [artistSlug: { [albumSlug: { [trackSlug: TrackIndex[]] }] }] };
	}
}

export {};
