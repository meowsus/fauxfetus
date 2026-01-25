import type { Artist } from '@fauxfetus/generator';
import fs from 'fs-extra';
import { join } from 'path';

let catalogMemo: Artist[] = [];

export const readCatalog = async (): Promise<Artist[]> => {
	if (catalogMemo.length > 0) return catalogMemo;

	const catalogPath = join(process.cwd(), 'static', 'data', 'catalog.json');
	const catalog = await fs.readJson(catalogPath);

	catalogMemo = catalog;

	return catalog;
};
