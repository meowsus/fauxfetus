import { readNewsPost, readNewsSummary } from '#lib/helpers/news.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const entries = async () => {
	const posts = await readNewsSummary();
	return posts.map((post) => ({
		slug: post.slug
	}));
};

export const load: PageServerLoad = async ({ params }) => {
	const post = await readNewsPost(params.slug);

	if (!post) {
		throw error(404, 'News post not found');
	}

	return { post };
};
