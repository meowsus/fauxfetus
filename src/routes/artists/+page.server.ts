import type { Artist } from '@fauxfetus/generator';
import fs from 'fs-extra';
import { join } from 'path';
import type { PageServerLoad } from './$types';

const catalogPath = join(process.cwd(), 'static', 'data', 'catalog.json');
const artists: Artist[] = await fs.readJson(catalogPath);

export const load: PageServerLoad = async () => {
	return { artists };
};
