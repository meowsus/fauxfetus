import type { Recommendations } from '@fauxfetus/generator';
import fs from 'fs-extra';
import { join } from 'path';

let recommendationsMemo: Recommendations = {};

/**
 * Load the precomputed recommendations graph from
 * `static/data/recommendations.json`. Each key is an artist slug and each
 * value is a list of related artist slugs, ordered from strongest to
 * weakest match (see `DataGenerator.buildRecommendations` for the sort).
 *
 * Memoized for the lifetime of the process — the file is read at most once.
 */
export const readRecommendations = async (): Promise<Recommendations> => {
	if (Object.keys(recommendationsMemo).length > 0) return recommendationsMemo;

	const path = join(process.cwd(), 'static', 'data', 'recommendations.json');
	const recommendations = await fs.readJson(path);

	recommendationsMemo = recommendations;

	return recommendations;
};
