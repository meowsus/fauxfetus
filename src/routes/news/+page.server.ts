import { readNewsSummary } from '$lib/helpers/news';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { posts: await readNewsSummary() };
};
