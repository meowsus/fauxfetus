import { readNewsSummary } from '#lib/helpers/news.js';
import { BASE_URL } from '#lib/helpers/seo.js';
import type { Artist } from '@fauxfetus/data-generator';
import fs from 'fs-extra';
import { join } from 'path';

// Without this export the route is dynamic and adapter-static ships no
// sitemap artifact at all. Pre-existing gap: this file prerendered on
// neither main nor any earlier build (only robots.txt, a static file,
// made it into build/). With it, `build/sitemap.xml` is emitted as a
// plain file the host serves directly.
export const prerender = true;

export async function GET() {
	const baseUrl = BASE_URL;

	const dataPath = join(process.cwd(), 'static', 'data', 'catalog.json');
	const artists: Artist[] = await fs.readJson(dataPath);

	const today = new Date().toISOString().split('T')[0];

	const urls: string[] = [];

	// Homepage
	urls.push(urlEntry(`${baseUrl}/`, today, 'daily', '1.0'));

	// Artists listing
	urls.push(urlEntry(`${baseUrl}/artists/`, today, 'daily', '0.9'));

	// News index + posts (post lastmod = publish date)
	urls.push(urlEntry(`${baseUrl}/news/`, today, 'weekly', '0.7'));
	for (const post of await readNewsSummary()) {
		urls.push(urlEntry(`${baseUrl}/news/${post.slug}/`, post.date, 'monthly', '0.6'));
	}

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
