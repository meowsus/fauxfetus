import { readNewsSummary } from '#lib/helpers/news.js';
import { BASE_URL, canonicalUrl } from '#lib/helpers/seo.js';

// Same lesson as the sitemap: without this export the route is dynamic and
// adapter-static ships no feed artifact at all; `build/news/feed.xml` is
// emitted as a plain file the host serves directly.
export const prerender = true;

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export async function GET() {
	const posts = await readNewsSummary();
	// Post dates are plain YYYY-MM-DD; anchoring at UTC midnight keeps the
	// prerendered output deterministic (no wall-clock reads at build time).
	const rfc822 = (date: string): string => new Date(`${date}T00:00:00Z`).toUTCString();

	const items = posts.map(
		(post) => `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${canonicalUrl(`/news/${post.slug}/`)}</link>
    <guid isPermaLink="true">${canonicalUrl(`/news/${post.slug}/`)}</guid>
    <pubDate>${rfc822(post.date)}</pubDate>
    <description>${escapeXml(post.excerpt)}</description>
  </item>`
	);

	const lastBuildDate =
		posts.length > 0 ? `    <lastBuildDate>${rfc822(posts[0].date)}</lastBuildDate>\n` : '';

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Faux Fetus news</title>
    <link>${canonicalUrl('/news/')}</link>
    <description>Ramblings and release notes from the Faux Fetus collective.</description>
    <language>en-us</language>
    <atom:link href="${BASE_URL}/news/feed.xml" rel="self" type="application/rss+xml" />
${lastBuildDate}${items.join('\n')}
  </channel>
</rss>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/rss+xml'
		}
	});
}
