// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Track {
			artistSlug: string;
			albumSlug: string;
			titleSlug: string;
			duration: number;
			album: string;
			artist: string;
			composer: string[];
			title: string;
			track: number | null;
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
