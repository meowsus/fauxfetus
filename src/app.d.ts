// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface TrackMetadata {
			duration: number;
			album: string;
			artist: string;
			composer: string[];
			title: string;
			track: number | null;
		}

		interface Track extends TrackMetadata {
			artistSlug: string;
			albumSlug: string;
			titleSlug: string;
		}

		interface Album {
			artistSlug: string;
			albumSlug: string;
			artist: string;
			album: string;
			tracks: Track[];
		}

		interface Artist {
			artistSlug: string;
			artist: string;
			albums: Album[];
		}
	}
}

export {};
