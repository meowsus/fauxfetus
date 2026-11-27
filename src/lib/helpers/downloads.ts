/**
 * Raw server path for the album-zip sidecar (deployed at fauxfetus.net/dl/,
 * outside the SvelteKit route tree). Pages must wrap the result in asset()
 * from '$app/paths' — and the sidecar only exists on the server, so the
 * download button 404s in local dev/preview by design.
 * See plans/audio-downloads.md.
 *
 * Keep this module free of Node-only imports (fs/path): it is shared with
 * the browser bundle. For the same reason, don't import readCatalog from
 * `#lib/helpers/catalog.ts` here — that module is server-only.
 */
export const albumZipPath = (artistSlug: string, albumSlug: string): string =>
	`dl/${artistSlug}/${albumSlug}/`;
