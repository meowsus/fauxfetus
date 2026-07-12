import { confirm, input } from '@inquirer/prompts';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { Apev2Writer } from './Apev2Writer';
import { CdParanoia } from './CdParanoia';
import { CdTextReader, type CdTextData } from './CdTextReader';
import { ExistingAlbumMatcher, type ExistingAlbumMatch } from './ExistingAlbumMatcher';
import { LameEncoder } from './LameEncoder';
import { createSlug } from './Slugify';
import type { AlbumDefaults, AlbumMetadata, DiscToc, RipperConfig, TrackMetadata } from './types';

/**
 * Orchestrates the full interactive CD-rip flow:
 *
 *  1. query the disc TOC (track count + per-track lengths)
 *  2. read CD-TEXT for prompt defaults (best-effort)
 *  3. if CD-TEXT is absent, match the disc TOC against existing rips in the
 *     generated catalog and use that album's tags as defaults
 *  4. prompt for album + per-track metadata (defaults pre-filled from above)
 *  5. check for an existing album directory and offer to replace it
 *  6. rip each track to a temp dir (WAV → MP3 → APEv2 tags)
 *  7. verify all expected MP3s were produced
 *  8. place files into the audio dir (replacing the old album if asked)
 *  9. print a summary with the next-step reminder
 *
 * The temp-first strategy means a failed rip never touches the existing
 * album: old files are only deleted after the new files verify.
 */
export class Ripper {
	private readonly cdParanoia: CdParanoia;
	private readonly cdTextReader: CdTextReader;
	private readonly matcher: ExistingAlbumMatcher;
	private readonly lame: LameEncoder = new LameEncoder();
	private readonly config: RipperConfig;

	constructor(config: RipperConfig) {
		this.config = config;
		this.cdParanoia = new CdParanoia(config.cdDevice);
		this.cdTextReader = new CdTextReader(config.cdDevice);
		// The generated catalog/track-metadata live in `static/data`, the sibling
		// of the audio dir. Deriving it from `audioDir` avoids a new env var.
		this.matcher = new ExistingAlbumMatcher(path.join(path.dirname(config.audioDir), 'data'));
	}

	/** Run the full interactive rip flow. Returns a process exit code. */
	async run(): Promise<number> {
		const toc = await this.queryDisc();
		if (toc === null) return 1;

		const cdText = await this.cdTextReader.read();
		const defaults = await this.buildDefaults(toc, cdText);

		const album = await this.promptAlbumMetadata(defaults);
		const tracks = await this.promptTrackTitles(toc.trackCount, defaults);

		const replacing = await this.checkExistingAlbum(album);
		if (replacing === 'abort') return 0;

		const tempDir = await this.ripToTemp(album, tracks);
		if (tempDir === null) return 1;

		const ok = await this.verify(tempDir, tracks.length);
		if (!ok) {
			await fs.remove(tempDir);
			console.error('✗ Verification failed — old album left untouched, temp dir cleaned up.');
			return 1;
		}

		await this.placeFiles(tempDir, album, replacing === 'replace');
		this.printSummary(album, tracks.length);
		return 0;
	}

	/** Step 1: query the disc TOC, or null on error. */
	private async queryDisc(): Promise<DiscToc | null> {
		try {
			const toc = await this.cdParanoia.getToc();
			console.log(
				`✓ Found ${toc.trackCount} track${toc.trackCount === 1 ? '' : 's'} on ${this.config.cdDevice}.`
			);
			return toc;
		} catch (error) {
			console.error(error instanceof Error ? error.message : String(error));
			return null;
		}
	}

	/**
	 * Step 2–3: assemble prompt defaults. CD-TEXT is favored; when CD-TEXT is
	 * empty we attempt to match the disc TOC against existing rips in the
	 * generated catalog and fill defaults from the matched album. Each field
	 * falls back to null/empty if neither source provides it.
	 */
	private async buildDefaults(toc: DiscToc, cdText: CdTextData): Promise<AlbumDefaults> {
		let existing: ExistingAlbumMatch | null = null;
		if (this.isCdTextEmpty(cdText)) {
			existing = await this.matcher.findMatch(toc);
			if (existing) {
				console.log(
					`✓ Matched existing rip: ${existing.artistName} / ${existing.albumTitle} — using its tags as defaults.`
				);
			}
		}

		const trackTitles: (string | null)[] = [];
		for (let i = 0; i < toc.trackCount; i++) {
			trackTitles.push(cdText.trackTitles[i] ?? existing?.trackTitles[i] ?? null);
		}

		return {
			albumTitle: cdText.albumTitle ?? existing?.albumTitle ?? null,
			artistName: cdText.artistName ?? existing?.artistName ?? null,
			composers: cdText.composer ? [cdText.composer] : (existing?.composers ?? []),
			trackTitles
		};
	}

	/** Whether CD-TEXT yielded any usable field at all. */
	private isCdTextEmpty(cdText: CdTextData): boolean {
		return (
			!cdText.albumTitle &&
			!cdText.artistName &&
			!cdText.composer &&
			cdText.trackTitles.every((t) => !t)
		);
	}

	/** Step 4a: prompt for album-level metadata, pre-filled from merged defaults. */
	private async promptAlbumMetadata(defaults: AlbumDefaults): Promise<AlbumMetadata> {
		const albumTitle = await this.promptRequired('Album title:', defaults.albumTitle);
		const artistName = await this.promptRequired('Artist name:', defaults.artistName);
		const composer = await this.promptComposers(defaults.composers);

		return { albumTitle, artistName, composer };
	}

	/**
	 * Step 4a (composers): collect one or more composer names, one per prompt.
	 * Each prompt is pre-filled with the corresponding default composer (from
	 * CD-TEXT or an existing-rip match); once defaults run out, prompts are blank
	 * and a blank entry ends the list. The collected names are joined with a null
	 * byte (`\x00`) for the APEv2 COMPOSER tag — this is the APEv2-native
	 * multi-value separator and matches how Kid3 writes multi-composers.
	 * `music-metadata` splits on `\x00`, so each composer becomes a distinct
	 * COMPOSER entry (which is what the generator's `buildComposerSets` expects).
	 * An empty list falls back to "Unknown".
	 */
	private async promptComposers(composerDefaults: string[]): Promise<string> {
		const composers: string[] = [];
		let i = 0;
		while (true) {
			const next = await input({
				message:
					i === 0 ? 'Composer (blank for Unknown):' : 'Add another composer (blank to finish):',
				default: i < composerDefaults.length ? composerDefaults[i] : ''
			});
			const t = next.trim();
			if (!t) break;
			composers.push(t);
			i++;
		}
		return composers.length > 0 ? composers.join('\x00') : 'Unknown';
	}

	/** Step 4b: prompt for each track title, pre-filled from merged defaults.
	 * If the album has no track titles, skip the per-track prompts and use
	 * "Untitled" for every track.
	 */
	private async promptTrackTitles(
		trackCount: number,
		defaults: AlbumDefaults
	): Promise<TrackMetadata[]> {
		const hasTitles = await confirm({
			message: 'Does this album have track titles?',
			default: true
		});

		const tracks: TrackMetadata[] = [];
		for (let n = 1; n <= trackCount; n++) {
			const title = hasTitles
				? await input({
						message: `Track ${pad(n)} title (blank for Untitled):`,
						default: defaults.trackTitles[n - 1] ?? ''
					})
				: '';
			tracks.push({ number: n, title: title.trim() || 'Untitled' });
		}
		return tracks;
	}

	/** Step 4: check for an existing album dir; returns 'replace' | 'keep' | 'abort'. */
	private async checkExistingAlbum(album: AlbumMetadata): Promise<'replace' | 'keep' | 'abort'> {
		const albumDir = this.albumDir(album);
		if (!(await fs.pathExists(albumDir))) return 'keep';

		const files = await fs.readdir(albumDir);
		const hasMp3 = files.some((f) => f.endsWith('.mp3'));
		if (!hasMp3) return 'keep';

		const replace = await confirm({
			message: `Artist '${album.artistName}' / Album '${album.albumTitle}' already exists. Replace with new rip?`,
			default: false
		});
		return replace ? 'replace' : 'abort';
	}

	/**
	 * Step 5: rip every track to a temp dir. WAV → MP3 → APEv2 tags → delete
	 * WAV. Returns the temp dir path, or null if a track failed to rip (the
	 * temp dir is kept so the user can inspect partial output before cleanup).
	 */
	private async ripToTemp(album: AlbumMetadata, tracks: TrackMetadata[]): Promise<string | null> {
		const tempDir = path.join(os.tmpdir(), `fauxfetus-rip-${Date.now()}`);
		await fs.ensureDir(tempDir);

		let failed = false;
		for (const track of tracks) {
			const wavPath = path.join(tempDir, `track-${pad(track.number)}.wav`);
			const trackSlug = createSlug(track.title);
			const mp3Path = path.join(tempDir, `${pad(track.number)}-${trackSlug}.mp3`);

			try {
				process.stdout.write(`  Ripping track ${pad(track.number)} of ${pad(tracks.length)}… `);
				await this.cdParanoia.ripTrack(track.number, wavPath);
				await this.lame.encode(wavPath, mp3Path);
				await Apev2Writer.write(mp3Path, this.tagsFor(album, track));
				await fs.remove(wavPath);
				console.log('done');
			} catch (error) {
				console.log('FAILED');
				console.error(error instanceof Error ? error.message : String(error));
				failed = true;
			}
		}

		return failed ? null : tempDir;
	}

	/** Step 6: verify all expected MP3s exist and are non-empty. */
	private async verify(tempDir: string, trackCount: number): Promise<boolean> {
		const files = (await fs.readdir(tempDir)).filter((f) => f.endsWith('.mp3'));
		if (files.length !== trackCount) {
			console.error(`✗ Expected ${trackCount} MP3s, found ${files.length}.`);
			return false;
		}
		for (const f of files) {
			const stat = await fs.stat(path.join(tempDir, f));
			if (stat.size === 0) {
				console.error(`✗ ${f} is empty.`);
				return false;
			}
		}
		return true;
	}

	/**
	 * Step 7: move MP3s from temp into the album dir. If replacing, delete
	 * the old album dir contents first. Always cleans up the temp dir.
	 */
	private async placeFiles(
		tempDir: string,
		album: AlbumMetadata,
		replacing: boolean
	): Promise<void> {
		const albumDir = this.albumDir(album);
		await fs.ensureDir(albumDir);

		if (replacing) {
			await fs.emptyDir(albumDir);
		}

		const mp3s = (await fs.readdir(tempDir)).filter((f) => f.endsWith('.mp3'));
		for (const f of mp3s) {
			await fs.move(path.join(tempDir, f), path.join(albumDir, f), { overwrite: true });
		}
		await fs.remove(tempDir);
	}

	/** Step 8: print the summary and next-step reminder. */
	private printSummary(album: AlbumMetadata, trackCount: number): void {
		const rel = path.relative(process.cwd(), this.albumDir(album));
		console.log(`✓ Ripped ${trackCount} track${trackCount === 1 ? '' : 's'} to ${rel}/`);
		console.log('Run `pnpm data:validate` then `pnpm generate:data` to update the site.');
	}

	/** Build the APEv2 tag map for a single track. */
	private tagsFor(album: AlbumMetadata, track: TrackMetadata): Record<string, string> {
		return {
			ARTIST: album.artistName,
			ALBUM: album.albumTitle,
			TITLE: track.title,
			TRACK: String(track.number),
			COMPOSER: album.composer
		};
	}

	/** Resolve `<audioDir>/<artistSlug>/<albumSlug>/`. */
	private albumDir(album: AlbumMetadata): string {
		return path.join(
			this.config.audioDir,
			createSlug(album.artistName),
			createSlug(album.albumTitle)
		);
	}

	/**
	 * Prompt for a required (non-empty) text value. Re-prompts on blank
	 * input. `cdTextDefault` is used as the pre-filled default if present.
	 */
	private async promptRequired(message: string, defaultValue: string | null): Promise<string> {
		return input({
			message,
			default: defaultValue ?? '',
			validate: (value) => (value.trim().length > 0 ? true : 'This field is required.')
		});
	}
}

/** Zero-pad a number to two digits (01, 02, …, 12). */
function pad(n: number): string {
	return String(n).padStart(2, '0');
}
