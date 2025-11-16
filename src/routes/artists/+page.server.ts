import fs from 'fs-extra';
import { join } from 'path';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const dataPath = join(process.cwd(), 'static', 'data', 'index.json');
	const artists: App.ArtistsIndex = await fs.readJson(dataPath);
	return { artists };
};
