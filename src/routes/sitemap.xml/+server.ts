import type { Artist } from '@fauxfetus/data-generator';
import fs from 'fs-extra';
import { join } from 'path';

export async function GET() {
	const baseUrl = 'https://fauxfetus.net';

	const dataPath = join(process.cwd(), 'static', 'data', 'catalog.json');
	const artists: Artist[] = await fs.readJson(dataPath);

	const today = new Date().toISOString().split('T')[0];

	const urls: string[] = [];

	// Homepage
	urls.push(urlEntry(`${baseUrl}/`, today, 'daily', '1.0'));

	// Artists listing
	urls.push(urlEntry(`${baseUrl}/artists/`, today, 'daily', '0.9'));

	// Artist, album, and track pages
	for (const artist of artists) {
		urls.push(urlEntry(`${baseUrl}/artists/${artist.slug}/`, today, 'weekly', '0.8'));

		for (const album of artist.albums) {
			urls.push(
				urlEntry(`${baseUrl}/artists/${artist.slug}/${album.slug}/`, today, 'monthly', '0.7')
			);

			for (const track of album.tracks) {
				urls.push(
					urlEntry(
						`${baseUrl}/artists/${artist.slug}/${album.slug}/${track.slug}/`,
						today,
						'monthly',
						'0.6'
					)
				);
			}
		}
	}

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml'
		}
	});
}

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string): string {
	return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}
