import { getRecentPosts, getRecentReleaseGroups, readNewsSummary } from '#lib/helpers/news.js';
import type { PageServerLoad } from './$types';

/**
 * The homepage is now a "what's new" surface fed by the news directory
 * (content/news/*.md; see #lib/helpers/news.ts and plans/site-news.md):
 * releases listed in post frontmatter drive "Recently added"; the newest
 * posts appear as a teaser pointing at /news/ for the full ramblings.
 */
export const load: PageServerLoad = async () => {
	const posts = await readNewsSummary();

	return {
		recentGroups: getRecentReleaseGroups(posts),
		recentPosts: getRecentPosts(posts)
	};
};
