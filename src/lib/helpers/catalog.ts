/**
 * SERVER-ONLY: this module pulls in fs/path, so importing it from client
 * code breaks the browser build (fs-extra resolves as a browser external).
 * Client-safe helpers live in their own modules (e.g. downloads.ts).
 */
import type { Artist } from '@fauxfetus/data-generator';
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

/**
 * Raw server path for the album-zip sidecar (deployed at fauxfetus.net/dl/,
 * outside the SvelteKit route tree). Pages must wrap the result in resolve()
 * from '$app/paths' — and the sidecar only exists on the server, so the
 * download button 404s in local dev/preview by design.
 * See plans/audio-downloads.md.
 */
export const albumZipPath = (artistSlug: string, albumSlug: string): string =>
	`/dl/${artistSlug}/${albumSlug}/`;
