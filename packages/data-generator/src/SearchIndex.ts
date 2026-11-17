/**
 * The search-index.json contract, owned by the file's writer (see
 * DataGenerator.writeSearchIndexJson). The on-disk format is nested
 * artist → album → track so each name and slug serializes once instead
 * of once per placement (a 99/239/3,532-entry flat list ran ~700 KB
 * raw; nested runs ~330 KB). The header search inflates a file of this
 * shape back into the flat `SearchIndexEntry` list at load.
 */
export type SearchIndexFile = SearchIndexArtist[];

export interface SearchIndexArtist {
	type: 'artist';
	name: string;
	slug: string;
	albums: SearchIndexAlbum[];
}

export interface SearchIndexAlbum {
	type: 'album';
	name: string;
	slug: string;
	tracks: SearchIndexTrack[];
}

export interface SearchIndexTrack {
	type: 'track';
	name: string;
	slug: string;

	/** Compilation placement: written only when the track's performing
	 * artist differs from the album's host artist (both together). */
	artistSlug?: string;
	artistName?: string;
}

/** Flattened search entry (what the header search filters over after
 * inflating nested search-index.json at load). None of the heavy catalog
 * payload — just enough to name and route to a page. */
export interface SearchIndexEntry {
	type: 'artist' | 'album' | 'track';
	name: string;
	slug: string;

	/** Album/track placement (albumSlug is the placement's parent album, not
	 * the track's own canonical album when it comes from a compilation). */
	artistSlug?: string;
	artistName?: string;
	albumSlug?: string;
}
