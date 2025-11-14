// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Track {
			artistSlug: string;
			albumSlug: string;
			trackSlug: string;
		}

		interface Album {
			artistSlug: string;
			albumSlug: string;
			tracks: TrackData[];
		}

		interface Artist {
			artistSlug: string;
			albums: AlbumData[];
		}
	}
}

export {};
