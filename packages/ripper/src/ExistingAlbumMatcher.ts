import fs from 'fs-extra';
import path from 'node:path';
import type { DiscToc } from './types';

/**
 * Per-track duration match tolerance, in seconds. Existing re-rips of the
 * same CD should agree within a fraction of a second, but VBR duration
 * computation and encoder padding can introduce small drift — 2 seconds is
 * generous enough to never miss a genuine match while remaining discriminative
 * enough to avoid false positives across a large catalog.
 */
const DURATION_TOLERANCE_SEC = 2;

/** Shapes of the generated catalog.json (subset we consume). */
interface CatalogTrack {
	name: string;
	number: number;
	artistName: string;
	albumName: string;
	audioUrl: string;
}
interface CatalogAlbum {
	isCompilation: boolean;
	tracks: CatalogTrack[];
}
interface CatalogArtist {
	albums: CatalogAlbum[];
}

/** Shape of track-metadata.json entries (subset we consume). */
interface TrackMetadataEntry {
	format?: { duration?: number };
	native?: { APEv2?: { id: string; value: unknown }[] };
}

/**
 * Metadata gleaned from a matched existing rip, used to pre-fill the ripper's
 * prompts when CD-TEXT is unavailable.
 */
export interface ExistingAlbumMatch {
	albumTitle: string;
	artistName: string;
	/** Composer names from the first track (APEv2 multi-values, already split). */
	composers: string[];
	/** Per-track titles, ordered by track number. */
	trackTitles: string[];
}

/**
 * Best-effort matcher that finds an existing rip in the generated catalog whose
 * disc TOC (track count + per-track durations) matches the CD currently in the
 * drive. Used to pre-fill prompt defaults when re-ripping an album for a quality
 * upgrade and the disc has no CD-TEXT.
 *
 * Reads the generated `catalog.json` (album/track grouping + titles) and
 * `track-metadata.json` (per-track `format.duration` + raw APEv2 tags) from
 * `dataDir` — no MP3 parsing required. If either file is missing or stale, or no
 * album's TOC matches, `findMatch` returns `null` and the ripper falls back to
 * fully manual prompts (same as today).
 */
export class ExistingAlbumMatcher {
	private readonly dataDir: string;

	constructor(dataDir: string) {
		this.dataDir = dataDir;
	}

	/**
	 * Find the existing album whose track count and per-track durations best
	 * match the disc TOC. Returns `null` if the catalog data is unavailable or
	 * no album matches within the duration tolerance.
	 */
	async findMatch(toc: DiscToc): Promise<ExistingAlbumMatch | null> {
		const catalog = await this.readJson<CatalogArtist[]>(path.join(this.dataDir, 'catalog.json'));
		const trackMeta = await this.readJson<Record<string, TrackMetadataEntry>>(
			path.join(this.dataDir, 'track-metadata.json')
		);
		if (!catalog || !trackMeta) return null;

		let best: { match: ExistingAlbumMatch; totalDelta: number } | null = null;

		for (const artist of catalog) {
			for (const album of artist.albums) {
				// The ripper handles standard albums only — skip compilations.
				if (album.isCompilation) continue;
				if (album.tracks.length !== toc.trackCount) continue;

				const sorted = [...album.tracks].sort((a, b) => a.number - b.number);
				const deltas = this.durationDeltas(sorted, trackMeta, toc.trackLengthsSeconds);
				if (!deltas) continue;

				const totalDelta = deltas.reduce((sum, d) => sum + d, 0);
				if (!best || totalDelta < best.totalDelta) {
					best = { match: this.extractMatch(sorted, trackMeta), totalDelta };
				}
			}
		}

		return best?.match ?? null;
	}

	/**
	 * Compare each candidate track's duration to the disc TOC. Returns the
	 * per-track absolute deltas if every track is within tolerance (and every
	 * duration is known), otherwise `null` (no match).
	 */
	private durationDeltas(
		tracks: CatalogTrack[],
		trackMeta: Record<string, TrackMetadataEntry>,
		tocLengths: number[]
	): number[] | null {
		const deltas: number[] = [];
		for (let i = 0; i < tracks.length; i++) {
			const duration = trackMeta[tracks[i].audioUrl]?.format?.duration;
			if (duration == null) return null;
			const delta = Math.abs(duration - tocLengths[i]);
			if (delta > DURATION_TOLERANCE_SEC) return null;
			deltas.push(delta);
		}
		return deltas;
	}

	/**
	 * Build the defaults payload from a matched album's tracks. Album/artist
	 * names and track titles come from the catalog; composers come from the
	 * first track's raw APEv2 COMPOSER items (already split on null bytes by
	 * the generator's metadata parser).
	 */
	private extractMatch(
		tracks: CatalogTrack[],
		trackMeta: Record<string, TrackMetadataEntry>
	): ExistingAlbumMatch {
		const first = tracks[0];
		const firstMeta = trackMeta[first.audioUrl];
		// `music-metadata` already splits APEv2 text on null bytes, so null-separated
		// composers arrive as multiple COMPOSER entries. Older rips in the catalog
		// may store composers pipe-separated within a single entry, so we also split
		// on `|` to recover individual names either way.
		const composers = (firstMeta?.native?.APEv2 ?? [])
			.filter((item) => item.id === 'COMPOSER')
			.flatMap((item) => (typeof item.value === 'string' ? item.value : '').split('|'))
			.map((name) => name.trim())
			.filter((name) => name.length > 0);

		return {
			albumTitle: first.albumName,
			artistName: first.artistName,
			composers,
			trackTitles: tracks.map((t) => t.name)
		};
	}

	/** Read and parse a JSON file, returning `null` if it's missing or invalid. */
	private async readJson<T>(filePath: string): Promise<T | null> {
		try {
			return await fs.readJson(filePath);
		} catch {
			return null;
		}
	}
}
