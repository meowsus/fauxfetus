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
