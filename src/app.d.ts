// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface TrackData {
			artistSlug: string;
			albumSlug: string;
			trackSlug: string;
		}

		interface AlbumData {
			artistSlug: string;
			albumSlug: string;
			tracks: TrackData[];
		}

		interface ArtistData {
			artistSlug: string;
			albums: AlbumData[];
		}
	}
}

export {};
