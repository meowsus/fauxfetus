/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { version } from '$app/env';
import { assets, immutable } from '$app/manifest';

// SAFETY: inside a service worker, globalThis is the
// ServiceWorkerGlobalScope per spec; the lib references above type it.
const self = globalThis as unknown as ServiceWorkerGlobalScope;

/**
 * Data sidecars the browser fetches directly, regardless of cache name: the
 * radio queue grammar in #lib/helpers/index.ts and the search index in
 * Search.svelte.
 *
 * Served network-first with the installed copy as offline fallback:
 * their content changes without their URLs changing, so cache-first
 * could pin a stale copy across a deploy that bumps neither the package
 * version nor the generated file list (deploy.sh regenerates these on
 * every run; only release.sh bumps). Nothing is written to the cache
 * here — install stays the only cache-population step.
 */
const DATA_ASSETS = ['/data/tracks.json', '/data/search-index.json'];

const ASSETS = [...immutable, ...assets]
	.map((entry) => entry.path)
	.filter((path) => {
		const pathname = new URL(path, self.location.origin).pathname;
		// Excluded from the install set:
		// - the bulky audio files and the generated data sidecars the browser
		//   never fetches (catalog, track metadata, recommendations are read
		//   by server-only code during build/prerender — and catalog.json is
		//   too big to cache regardless);
		// - the dl/ zip sidecar namespace: its requests are generated on
		//   demand and its redirect targets must never be intercepted or
		//   cached;
		// - crawler/share-only files (robots.txt, og-image.png) and the
		//   deployed .htaccess, whose install-time fetch is 403-rejected by
		//   Apache, so caching it would only log install failures;
		// - icons/icon.png: unreferenced source art, kept on disk.
		return (
			!pathname.startsWith('/audio') &&
			!pathname.startsWith('/dl') &&
			// defensive: never precache prerendered HTML. The manifest's `immutable`
			// list holds only immutable build output today; if a future version ever
			// added prerendered pages to it, this keeps them out of the install
			// set — and out of the contract hash, whose cache name must not
			// churn on every content-only deploy.
			!pathname.endsWith('.html') &&
			pathname !== '/.htaccess' &&
			pathname !== '/og-image.png' &&
			pathname !== '/robots.txt' &&
			pathname !== '/icons/icon.png' &&
			pathname !== '/data/catalog.json' &&
			pathname !== '/data/track-metadata.json' &&
			pathname !== '/data/recommendations.json'
		);
	});

const isInstallAsset = (pathname: string): boolean => ASSETS.includes(pathname);

/**
 * Compact fingerprint of a URL list: sorted, then length + 32-bit FNV-1a.
 */
function cacheContract(urls: string[]): string {
	// explicit comparator: the default string sort is fine (UTF-16 code
	// units), but spelling it out makes cross-rebuild determinism visible
	// and dodges locale-sensitive alternatives
	const sorted = [...urls].sort((a, b) => {
		if (a === b) return 0;
		return a < b ? -1 : 1;
	});
	let hash = 0x811c9dc5;
	for (const url of sorted) {
		for (let index = 0; index < url.length; index++) {
			hash ^= url.charCodeAt(index);
			hash = Math.imul(hash, 0x01000193) >>> 0;
		}
		// entry separator — keeps ['a','b'] hashing apart from ['ab']
		hash ^= 0xff;
	}
	return `${sorted.length}-${hash.toString(36)}`;
}

/**
 * The cache name embeds a hash of the install-set contract — the ASSETS
 * list this generation actually caches. Deploying without a version bump
 * purges the previous cache exactly when the cached set changed (new,
 * removed or newly excluded URLs, new build hashes) and reuse — cheap,
 * HTTP-cache-assisted — when it didn't; a version bump changes the name
 * wholesale. This replaces the manual `-rN` suffix discipline: the purge
 * key derives from the contract it protects, so there is nothing
 * periodic to remember. The suffix family's history: a same-version
 * `-r2` first purged the runtime-polluted `cache-3.0.0` copies shipped
 * on phones under the previous handler, which cached every response it
 * saw; `-r3` carried the trimmed install set (2026-11-27) until the hash
 * subsumed it.
 */
const CACHE = `cache-${version}-${cacheContract(ASSETS)}`;

self.addEventListener('install', (event: ExtendableEvent) => {
	// Activate immediately instead of waiting for existing tabs to close
	self.skipWaiting();

	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		const results = await Promise.allSettled(ASSETS.map((url) => cache.add(url)));
		const failed = results.filter((r) => r.status === 'rejected');
		if (failed.length > 0) {
			console.warn(
				`[service worker] Failed to cache ${failed.length} asset(s); install continued.`,
				failed
			);
		}
	}
	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event: ExtendableEvent) => {
	async function activate() {
		// Delete old caches from previous versions (and generation suffixes)
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
		// Take control of all open pages immediately so they use the new SW
		await self.clients.claim();
	}
	event.waitUntil(activate());
});

self.addEventListener('fetch', (event: FetchEvent) => {
	if (event.request.method !== 'GET') return;

	let url: URL;
	try {
		url = new URL(event.request.url);
	} catch {
		return; // malformed request URL — leave it to the browser
	}

	if (
		url.pathname.startsWith('/audio') ||
		url.pathname.startsWith('/dl') ||
		url.pathname === '/data/catalog.json'
	) {
		return;
	}

	// The fetch strategy has exactly three regimes:
	//
	// 1. client-fetched data sidecars (radio queue grammar, search
	//    index) — network-first with the installed copy as the offline
	//    fallback: their content changes without their URLs changing, so
	//    cache-first could pin a stale copy across a deploy that bumps
	//    neither the package version nor this script (see DATA_ASSETS);
	// 2. the rest of the install set (hashed build files, fonts, icons,
	//    the manifest) — cache-first, since the URL list and the cache
	//    name arrive with the same `version` and never cross a deploy;
	// 3. everything else — page HTML, __data.json data requests,
	//    _app/version.json (which Kit's update check depends on),
	//    cross-origin scripts — a pass-through: no respondWith, so the
	//    browser fetches natively, exactly as if no worker existed.
	//
	// Unbounded runtime cache population stays banned REGARDLESS of
	// regime: nothing is ever written to a cache outside install —
	// regimes 1–2 only read. The original handler cached every 200 it
	// saw (pages, data URLs with query variants, even cross-origin
	// responses, which the Cache API rejects outright), so months of
	// browsing filled phones' storage quota until cache operations began
	// failing inside the worker — every intercepted request then failed
	// at once, SvelteKit committed its error branch without the
	// version-mismatch reload fallback (fresh app ⇒ versions match), and
	// navigation went dead until a full refresh. The May 2026 fix d5bc2ae
	// ("Actually fix service worker :|") corrected this same failure
	// class at eager-cache scale; the pass-through restores that
	// corrected invariant permanently.
	if (DATA_ASSETS.includes(url.pathname)) {
		event.respondWith(respondData());
		return;
	}

	if (!isInstallAsset(url.pathname)) {
		return;
	}

	async function respondData(): Promise<Response> {
		let networkError: unknown;
		try {
			// `no-cache` revalidates against the origin even when the HTTP
			// cache believes it holds a fresh copy, keeping "network first"
			// honest regardless of the server's Cache-Control (etags make
			// the revalidation a cheap conditional request).
			// pi-lens-ignore: ts-ssrf
			const response = await fetch(event.request, { cache: 'no-cache' });
			if (!(response instanceof Response)) {
				throw new Error('invalid response from fetch');
			}
			return response;
		} catch (err) {
			networkError = err;
		}

		// Offline with a completed install: serve the installed copy, then
		// give up the way the browser would.
		try {
			const cache = await caches.open(CACHE);
			const offline = await cache.match(url.pathname);
			if (offline) return offline;
		} catch {
			// storage unavailable — give up the way the browser would
		}
		throw networkError;
	}

	async function respond(): Promise<Response> {
		// Cache first — and only touch the cache for asset requests, so a
		// storage failure (quota, private mode) degrades to a plain network
		// fetch instead of failing the request. The handle is opened once
		// and reused by the offline fallback below.
		let networkError: unknown;
		let cache: Cache | undefined;
		try {
			cache = await caches.open(CACHE);
			const cached = await cache.match(url.pathname);
			if (cached) return cached;
		} catch {
			// storage unavailable — continue to the network
		}

		try {
			// pi-lens-ignore: ts-ssrf
			const response = await fetch(event.request);
			if (!(response instanceof Response)) {
				throw new Error('invalid response from fetch');
			}
			return response;
		} catch (err) {
			networkError = err;
		}

		// Offline with a completed install: serve the installed copy, then
		// give up the way the browser would.
		try {
			const offline = await cache?.match(url.pathname);
			if (offline) return offline;
		} catch {
			// storage failed — give up the way the browser would
		}
		throw networkError;
	}

	event.respondWith(respond());
});
