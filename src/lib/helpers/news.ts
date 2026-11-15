/**
 * SERVER-ONLY: this module pulls in fs/path, so importing it from client
 * code breaks the browser build (fs-extra resolves as a browser external).
 * Consumers are prerender-time load functions and the sitemap +server.ts.
 *
 * The news pipeline replaces the old freeform content.md changelog (see
 * plans/site-news.md):
 *
 *   content/news/YYYY-MM-DD-<slug>.md
 *     filename:    publishes the date AND the permalink:
 *                  /news/YYYY-MM-DD-<slug>/ (date keeps it collision-proof;
 *                  lexical sort = chronological)
 *     frontmatter: `title` (required); `music` (optional), a list of
 *                  `{ artist: <artistSlug>, albums?: [<albumSlug>] }`
 *     body:        freeform markdown prose (the ramblings)
 *
 * Anything listed in `music` is "new that people should pay attention to":
 * a newly added artist, a new album, or a better-quality re-rip. The homepage
 * "Recently added" list and each post's "Added to the catalog" section render
 * from it. Every slug is resolved against static/data/catalog.json at build
 * time and the build fails loudly on drift, so frontmatter-driven links
 * cannot rot silently. Hand-typed /artists/... links inside post prose get
 * the same drift protection.
 */
import type { Artist } from '@fauxfetus/data-generator';
import fs from 'fs-extra';
import matter from 'gray-matter';
import { marked } from 'marked';
import { join } from 'path';
import { readCatalog } from './catalog.js';

const NEWS_DIR = 'content/news';
const FILENAME_RE = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/;
const PROSE_ARTIST_LINK_RE = /\[[^\]]*\]\((\/artists\/[^)\s]+)\)/g;
const EXCERPT_LENGTH = 240;

/** Homepage news teaser count. */
export const RECENT_POST_CAP = 3;

/** Raw frontmatter shape; unknown keys are rejected (typo protection). */
export interface NewsMusicEntry {
	artist: string;
	albums?: string[];
}

/** One `music` entry resolved against the catalog (artist-grouped). */
export interface PostMusicGroup {
	artistSlug: string;
	artistName: string;
	albums: Array<{ slug: string; name: string }>;
}

/** One release row inside a homepage "Recently added" group. */
export interface NewsReleaseItem {
	artistSlug: string;
	artistName: string;
	/** artist-level announcement row (a new artist joins) when absent */
	albumSlug?: string;
	albumName?: string;
}

/** One announcement's slice of the homepage "Recently added" nested list. */
export interface NewsReleaseGroup {
	/** Full-stem post slug: permalinking at /news/<slug>/ */
	slug: string;
	date: string;
	items: NewsReleaseItem[];
}

export interface NewsPostMeta {
	slug: string;
	title: string;
	/** ISO YYYY-MM-DD, derived from the filename */
	date: string;
	excerpt: string;
	music: PostMusicGroup[];
}

export interface NewsPost extends NewsPostMeta {
	/** Parse-ready markdown body, rendered to HTML at build time. */
	html: string;
}

export interface NewsTeaser {
	slug: string;
	title: string;
	date: string;
	excerpt: string;
}

export type NewsPostMetadata = NewsPost | NewsPostMeta;

interface RawNewsFile {
	file: string;
	date: string;
	slug: string;
	title: string;
	music: NewsMusicEntry[];
	raw: string;
}

const malformed = (file: string, detail: string): Error => Error(`${file}: ${detail}`);
/** Descending comparator for lexically-comparable keys (ISO date filenames). */
function descending(one: string, other: string): number {
	if (one === other) return 0;
	return one < other ? 1 : -1;
}

function requireString(value: unknown, detail: string, file: string): string {
	if (typeof value !== 'string' || value.trim() === '') {
		throw malformed(file, detail);
	}
	return value.trim();
}

function unknownKeysError(
	record: Record<string, unknown>,
	allowed: string[],
	detail: string
): Error {
	const unknown = Object.keys(record).filter((key) => !allowed.includes(key));
	return malformed(
		detail,
		unknown.length > 0
			? `unknown key(s) "${unknown.join('", "')}" (expected only: ${allowed.join(', ')})`
			: detail
	);
}

function parseAlbumSlugs(value: unknown, entryIndex: number, file: string): string[] {
	if (!Array.isArray(value)) {
		throw malformed(file, `music[${entryIndex}].albums must be a list of album slugs`);
	}
	return value.map((slug, albumIndex) => {
		if (typeof slug !== 'string' || slug.trim() === '') {
			throw malformed(
				file,
				`music[${entryIndex}].albums[${albumIndex}] must be a non-empty slug string; quote slugs that look like numbers (e.g. '060503')`
			);
		}
		return slug.trim();
	});
}

function parseMusicEntry(item: unknown, entryIndex: number, file: string): NewsMusicEntry {
	if (typeof item !== 'object' || item === null) {
		throw malformed(file, `music[${entryIndex}] must be an object with at least "artist"`);
	}
	const entry = item as Record<string, unknown>;
	const entryError = unknownKeysError(entry, ['artist', 'albums'], `music[${entryIndex}]`);
	if (Object.keys(entry).some((key) => key !== 'artist' && key !== 'albums')) throw entryError;

	const parsed: NewsMusicEntry = {
		artist: requireString(entry['artist'], `music[${entryIndex}] requires an "artist" slug`, file)
	};
	if (entry['albums'] !== undefined) {
		parsed.albums = parseAlbumSlugs(entry['albums'], entryIndex, file);
	}
	return parsed;
}

function parseFrontmatter(data: unknown, file: string): { title: string; music: NewsMusicEntry[] } {
	if (typeof data !== 'object' || data === null) {
		throw malformed(file, 'missing frontmatter "title"');
	}
	const record = data as Record<string, unknown>;
	if (Object.keys(record).some((key) => key !== 'title' && key !== 'music')) {
		throw unknownKeysError(record, ['title', 'music'], 'frontmatter');
	}

	const title = requireString(record['title'], 'frontmatter requires a non-empty "title"', file);
	const music = record['music'] === undefined ? [] : parseMusicEntries(record['music'], file);

	return { title, music };
}

function parseMusicEntries(value: unknown, file: string): NewsMusicEntry[] {
	if (!Array.isArray(value)) {
		throw malformed(file, '"music" must be a list of { artist, albums? } entries');
	}
	return value.map((item, index) => parseMusicEntry(item, index, file));
}

async function loadRawNewsFiles(): Promise<RawNewsFile[]> {
	const dir = join(process.cwd(), NEWS_DIR);
	const names = (await fs.readdir(dir)).filter((name) => name.endsWith('.md'));

	// YYYY-MM-DD prefixes: descending sort = newest first.
	names.sort(descending);

	return Promise.all(
		names.map(async (name) => {
			const file = `${NEWS_DIR}/${name}`;
			const match = FILENAME_RE.exec(name);
			if (!match) {
				throw new Error(`${file}: filename must be YYYY-MM-DD-<slug>.md`);
			}
			const date = match[1];
			// Full stem (date included): the permalink slug, per approved design.
			const slug = name.replace(/\.md$/, '');
			if (Number.isNaN(Date.parse(date))) {
				throw new Error(`${file}: "${date}" is not a valid date`);
			}

			const contents = await fs.readFile(join(dir, name), 'utf-8');
			const { data, content } = matter(contents);
			const frontmatter = parseFrontmatter(data, file);

			return { file, date, slug, title: frontmatter.title, music: frontmatter.music, raw: content };
		})
	);
}

/** Plain-text teaser: first paragraph of the raw markdown, markup stripped. */
function excerptFromRaw(raw: string): string {
	const paragraphs = raw.split(/\n{2,}/).map((paragraph) => paragraph.trim());
	const firstPara =
		paragraphs.find((paragraph) => paragraph.length > 0 && !paragraph.startsWith('```')) ?? '';
	const text = firstPara
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[*_`]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	if (text.length <= EXCERPT_LENGTH) return text;
	return `${text.slice(0, EXCERPT_LENGTH).replace(/\s+\S*$/, '')}…`;
}

let newsCache: NewsPost[] | null = null;

interface CatalogIndex {
	artistBySlug: Map<string, Artist>;
	albumNamesByPath: Map<string, string>;
	errors: string[];
}

function buildCatalogIndex(catalog: Artist[]): CatalogIndex {
	return {
		artistBySlug: new Map(catalog.map((artist) => [artist.slug, artist])),
		albumNamesByPath: new Map(
			catalog.flatMap((artist) =>
				artist.albums.map((album) => [`${artist.slug}/${album.slug}`, album.name] as const)
			)
		),
		errors: []
	};
}

function resolveMusicGroup(
	entry: NewsMusicEntry,
	entryIndex: number,
	rawFile: string,
	index: CatalogIndex
): PostMusicGroup | null {
	const artist = index.artistBySlug.get(entry.artist);
	if (!artist) {
		index.errors.push(
			`${rawFile}: music[${entryIndex}]: no artist "${entry.artist}" in catalog.json`
		);
		return null;
	}

	const albumBySlug = new Map(artist.albums.map((album) => [album.slug, album]));
	const albums = (entry.albums ?? [])
		.map((albumSlug) => {
			const album = albumBySlug.get(albumSlug);
			if (!album) {
				const pathHint = index.albumNamesByPath.has(`${entry.artist}/${albumSlug}`)
					? ''
					: ` (the catalog has no ${entry.artist}/${albumSlug} path either)`;
				index.errors.push(
					`${rawFile}: music[${entryIndex}]: artist "${entry.artist}" has no album "${albumSlug}"${pathHint}`
				);
				return null;
			}
			return { slug: album.slug, name: album.name };
		})
		.filter((album): album is { slug: string; name: string } => album !== null);

	return {
		artistSlug: artist.slug,
		artistName: artist.name,
		albums
	};
}

/** Hand-typed prose links to the catalog get the same drift protection. */
function validateProseLinks(raw: RawNewsFile, index: CatalogIndex): void {
	for (const match of raw.raw.matchAll(PROSE_ARTIST_LINK_RE)) {
		const href = match[1].replace(/\/+$/, '');
		const segments = href.split('/').filter(Boolean);
		const artistSlug = segments[1];
		const albumSlug = segments[2];
		const fileRef = `${raw.file}: prose link ${href}:`;

		if (segments.length === 2) {
			if (artistSlug === undefined) {
				index.errors.push(`${fileRef} malformed artist path`);
			} else if (!index.artistBySlug.has(artistSlug)) {
				index.errors.push(`${fileRef} artist "${artistSlug}" not in catalog.json`);
			}
		} else if (segments.length === 3) {
			const artist = artistSlug !== undefined ? index.artistBySlug.get(artistSlug) : undefined;
			const hasAlbum =
				artist !== undefined && artist.albums.some((album) => album.slug === albumSlug);
			if (!hasAlbum) {
				index.errors.push(`${fileRef} no album "${albumSlug}" under artist "${artistSlug}"`);
			}
		} else {
			index.errors.push(`${fileRef} expected /artists/<artist>/ or /artists/<artist>/<album>/`);
		}
	}
}

export async function readNews(): Promise<NewsPost[]> {
	if (newsCache) return newsCache;

	const [catalog, rawFiles] = await Promise.all([readCatalog(), loadRawNewsFiles()]);
	const index = buildCatalogIndex(catalog);

	const posts = await Promise.all(
		rawFiles.map(async (raw): Promise<NewsPost> => {
			const music = raw.music
				.map((entry, entryIndex) => resolveMusicGroup(entry, entryIndex, raw.file, index))
				.filter((group): group is PostMusicGroup => group !== null);

			validateProseLinks(raw, index);

			const html = await marked.parse(raw.raw);

			return {
				slug: raw.slug,
				title: raw.title,
				date: raw.date,
				excerpt: excerptFromRaw(raw.raw),
				music,
				html
			};
		})
	);

	if (index.errors.length > 0) {
		throw new Error(
			`News failed to resolve against catalog.json (${index.errors.length} problem(s)):\n${index.errors.join('\n')}`
		);
	}

	newsCache = posts;
	return newsCache;
}

/** Post metadata without bodies: news index, sitemap, permalink discovery. */
export async function readNewsSummary(): Promise<NewsPostMeta[]> {
	const posts = await readNews();
	return posts.map((post) => ({
		slug: post.slug,
		title: post.title,
		date: post.date,
		excerpt: post.excerpt,
		music: post.music
	}));
}

export async function readNewsPost(slug: string): Promise<NewsPost | undefined> {
	return (await readNews()).find((post) => post.slug === slug);
}

/**
 * Homepage "Recently added": announcements grouped for the nested list.
 * Each group is one news post's `music`-frontmatter mentions, newest post
 * first; posts whose items were all superseded elsewhere are skipped. Items
 * are deduped by artist (artist-level announcements) and by artist/album
 * pair; the first mention in newest-first order wins, so a re-rip keeps the
 * newer context and the older announcement's group omits it. A post entry
 * that lists `albums` yields one item per album; a bare artist entry yields
 * a single "new artist" item. The group date links to the post, since the
 * post is what owns each item's date.
 */
export function getRecentReleaseGroups(posts: NewsPostMetadata[]): NewsReleaseGroup[] {
	const groups: NewsReleaseGroup[] = [];
	const seen = new Set<string>();

	for (const post of posts) {
		const items: NewsReleaseItem[] = [];
		for (const group of post.music) {
			if (group.albums.length === 0 && !seen.has(`artist:${group.artistSlug}`)) {
				seen.add(`artist:${group.artistSlug}`);
				items.push({
					artistSlug: group.artistSlug,
					artistName: group.artistName
				});
			}
			for (const album of group.albums) {
				const key = `album:${group.artistSlug}/${album.slug}`;
				if (seen.has(key)) continue;
				seen.add(key);
				items.push({
					artistSlug: group.artistSlug,
					artistName: group.artistName,
					albumSlug: album.slug,
					albumName: album.name
				});
			}
		}
		if (items.length > 0) {
			groups.push({ slug: post.slug, date: post.date, items });
		}
	}

	return groups;
}

/** Homepage news teaser: the newest posts' titles + excerpts. */
export function getRecentPosts(
	posts: NewsPostMetadata[],
	cap: number = RECENT_POST_CAP
): NewsTeaser[] {
	return posts.slice(0, cap).map((post) => ({
		slug: post.slug,
		title: post.title,
		date: post.date,
		excerpt: post.excerpt
	}));
}
