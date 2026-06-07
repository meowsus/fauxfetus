const BASE_URL = 'https://fauxfetus.net';
const SITE_NAME = 'Faux Fetus';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

/**
 * Wraps a JSON-LD object in a <script type="application/ld+json"> HTML string.
 */
export function jsonLdScript(data: Record<string, unknown>): string {
	return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

/**
 * Returns the full canonical URL for a given path.
 * Paths should start with / and end with / (trailing slash convention).
 */
export function canonicalUrl(path: string): string {
	if (!path.startsWith('/')) path = '/' + path;
	if (!path.endsWith('/')) path = path + '/';
	return `${BASE_URL}${path}`;
}

/**
 * Returns an object of Open Graph + Twitter Card meta tag key-value pairs.
 * Use in <svelte:head> with meta tags.
 */
export function ogMeta({
	title,
	description,
	url,
	type = 'website',
	image
}: {
	title: string;
	description: string;
	url: string;
	type?: string;
	image?: string;
}): Record<string, string> {
	const ogImage = image || DEFAULT_OG_IMAGE;
	return {
		'og:url': url,
		'og:type': type,
		'og:title': title,
		'og:description': description,
		'og:site_name': SITE_NAME,
		'og:image': ogImage,
		'twitter:card': 'summary_large_image',
		'twitter:title': title,
		'twitter:description': description,
		'twitter:image': ogImage
	};
}

/**
 * JSON-LD structured data constructors.
 */

/** WebSite schema for the homepage. */
export function jsonLdWebsite() {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: SITE_NAME,
		url: BASE_URL
	};
}

/** CollectionPage schema for the artists listing. */
export function jsonLdCollectionPage(url: string, name: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name,
		url
	};
}

/** MusicGroup schema for an artist page. */
export function jsonLdMusicGroup(artist: {
	name: string;
	slug: string;
	albums?: Array<{ name: string; slug: string }>;
}) {
	const ld: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': 'MusicGroup',
		name: artist.name,
		url: canonicalUrl(`/artists/${artist.slug}/`)
	};

	if (artist.albums && artist.albums.length > 0) {
		ld.album = artist.albums.map((album) => ({
			'@type': 'MusicAlbum',
			name: album.name,
			url: canonicalUrl(`/artists/${artist.slug}/${album.slug}/`)
		}));
	}

	return ld;
}

/**
 * ItemList JSON-LD describing artists related to the current one, in
 * order from strongest to weakest relationship. Each entry is a MusicGroup
 * ListItem; `about` ties the list back to the source artist so search
 * engines understand the relationship rather than treating it as a
 * generic ranked list.
 */
export function jsonLdRelatedArtists(
	sourceArtist: { name: string; slug: string },
	relatedArtists: Array<{ name: string; slug: string }>
) {
	return {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name: `Artists related to ${sourceArtist.name}`,
		about: {
			'@type': 'MusicGroup',
			name: sourceArtist.name,
			url: canonicalUrl(`/artists/${sourceArtist.slug}/`)
		},
		numberOfItems: relatedArtists.length,
		itemListElement: relatedArtists.map((artist, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			item: {
				'@type': 'MusicGroup',
				name: artist.name,
				url: canonicalUrl(`/artists/${artist.slug}/`)
			}
		}))
	};
}

/** MusicAlbum schema for an album page. */
export function jsonLdMusicAlbum(album: {
	name: string;
	slug: string;
	artistSlug: string;
	artistName: string;
	tracks?: Array<{ name: string; slug: string; number: number | null }>;
}) {
	const ld: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': 'MusicAlbum',
		name: album.name,
		url: canonicalUrl(`/artists/${album.artistSlug}/${album.slug}/`),
		byArtist: {
			'@type': 'MusicGroup',
			name: album.artistName,
			url: canonicalUrl(`/artists/${album.artistSlug}/`)
		}
	};

	if (album.tracks && album.tracks.length > 0) {
		ld.numTracks = album.tracks.length;
		ld.track = album.tracks.map((track) => ({
			'@type': 'MusicRecording',
			name: track.name,
			url: canonicalUrl(`/artists/${album.artistSlug}/${album.slug}/${track.slug}/`)
		}));
	}

	return ld;
}

/** MusicRecording schema for a track page. */
export function jsonLdMusicRecording(track: {
	name: string;
	slug: string;
	artistSlug: string;
	artistName: string;
	albumSlug: string;
	albumName: string;
}) {
	return {
		'@context': 'https://schema.org',
		'@type': 'MusicRecording',
		name: track.name,
		url: canonicalUrl(`/artists/${track.artistSlug}/${track.albumSlug}/${track.slug}/`),
		byArtist: {
			'@type': 'MusicGroup',
			name: track.artistName,
			url: canonicalUrl(`/artists/${track.artistSlug}/`)
		},
		inAlbum: {
			'@type': 'MusicAlbum',
			name: track.albumName,
			url: canonicalUrl(`/artists/${track.artistSlug}/${track.albumSlug}/`)
		}
	};
}

/** BreadcrumbList JSON-LD for structured breadcrumb data. */
export function jsonLdBreadcrumb(items: Array<{ name: string; href?: string }>) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => {
			const position = index + 1;
			if (item.href) {
				return {
					'@type': 'ListItem',
					position,
					name: item.name,
					item: canonicalUrl(item.href)
				};
			}
			return {
				'@type': 'ListItem',
				position,
				name: item.name
			};
		})
	};
}
