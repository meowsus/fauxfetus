import type { ArtistIndexData, ArtistsIndexData } from '@fauxfetus/generator';
import fs from 'fs-extra';
import { join } from 'path';

export async function GET() {
	// Get base URL from environment or default to localhost for dev
	const baseUrl = 'https://fauxfetus.net'; // or process.env.BASE_URL

	// Read all artists
	const dataPath = join(process.cwd(), 'static', 'data', 'index.json');
	const artists: ArtistsIndexData = await fs.readJson(dataPath);

	// Generate URLs for artists
	const artistUrls = artists.map((artist) => {
		const artistSlug = artist.artistPath.replace('/artists/', '');
		return `<url>
    <loc>${baseUrl}/artists/${artistSlug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
</url>`;
	});

	// Generate URLs for albums
	const albumUrls = [];
	for (const artist of artists) {
		const artistSlug = artist.artistPath.replace('/artists/', '');
		try {
			const artistIndexPath = join(process.cwd(), 'static', 'data', artistSlug, 'index.json');
			const artistData: ArtistIndexData = await fs.readJson(artistIndexPath);

			for (const album of artistData.albums) {
				const albumSlug = album.albumPath.split('/').pop()!;
				albumUrls.push(`<url>
    <loc>${baseUrl}/artists/${artistSlug}/${albumSlug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
</url>`);
			}
		} catch (error) {
			// Skip if artist data not found
			console.warn(`Could not load data for artist: ${artistSlug}`, error);
		}
	}

	// Combine all URLs
	const allUrls = [
		`<url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
</url>`,
		`<url>
    <loc>${baseUrl}/artists</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
</url>`,
		...artistUrls,
		...albumUrls
	].join('\n			');

	return new Response(
		`
        <?xml version="1.0" encoding="UTF-8" ?>
        <urlset
            xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:xhtml="http://www.w3.org/1999/xhtml"
            xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
            xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
            xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
            xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
        >
            ${allUrls}
        </urlset>`.trim(),
		{
			headers: {
				'Content-Type': 'application/xml'
			}
		}
	);
}
