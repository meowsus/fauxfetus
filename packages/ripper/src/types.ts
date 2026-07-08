/**
 * Tags written to each ripped MP3 file. Mirrors the `ApeTag` enum in
 * `@fauxfetus/validator` so the ripper and validator agree on field names.
 */
export interface TrackTags {
	ARTIST: string;
	ALBUM: string;
	TITLE: string;
	TRACK: string;
	COMPOSER: string;
}

/** Resolved configuration for the ripper orchestrator. */
export interface RipperConfig {
	/** CD drive device path, e.g. `/dev/sr0`. */
	cdDevice: string;
	/** Resolved absolute path to the audio root (`static/audio`). */
	audioDir: string;
}

/** Disc table-of-contents from `cdparanoia -Q`: track count + per-track length. */
export interface DiscToc {
	trackCount: number;
	/** Per-track length in seconds (CD frames ÷ 75), indexed by track order. */
	trackLengthsSeconds: number[];
}

/**
 * Merged prompt defaults assembled from CD-TEXT and an optional existing-album
 * match. Each field is null/empty when neither source provided it. CD-TEXT is
 * favored; the existing-album match fills the gaps.
 */
export interface AlbumDefaults {
	albumTitle: string | null;
	artistName: string | null;
	/** Pre-fill list for the multi-composer prompt (CD-TEXT yields one entry). */
	composers: string[];
	/** Per-track title defaults, indexed by track order (0 = track 1). */
	trackTitles: (string | null)[];
}

/** Album-level metadata gathered from interactive prompts. */
export interface AlbumMetadata {
	albumTitle: string;
	artistName: string;
	/** "Unknown" if the user left the composer prompt blank. */
	composer: string;
}

/** Per-track metadata gathered from interactive prompts. */
export interface TrackMetadata {
	/** 1-based track number from disc order. */
	number: number;
	/** Track title ("Untitled" if the user left the prompt blank). */
	title: string;
}
