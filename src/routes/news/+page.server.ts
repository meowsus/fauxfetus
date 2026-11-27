import { readNewsSummary } from '#lib/helpers/news.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { posts: await readNewsSummary() };
};
