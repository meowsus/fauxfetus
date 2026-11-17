/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, version } from '$service-worker';

// SAFETY: inside a service worker, globalThis is the
// ServiceWorkerGlobalScope per spec; the lib references above type it.
const self = globalThis as unknown as ServiceWorkerGlobalScope;

// The `-r2` generation suffix makes activation purge the runtime-polluted
// `cache-3.0.0` copies that shipped on phones under the previous handler,
// which cached every response it saw.
const CACHE = `cache-${version}-r2`;

const ASSETS = [...build, ...files].filter((url) => {
	const pathname = new URL(url, self.location.origin).pathname;
	// Exclude the bulky audio files and the generated data sidecar (too
	// big to cache), plus the dl/ zip sidecar namespace: its requests are
	// generated on demand and its redirect targets must never be
	// intercepted or cached.
	return (
		!pathname.startsWith('/audio') &&
		!pathname.startsWith('/dl') &&
		pathname !== '/data/catalog.json'
	);
});

const isInstallAsset = (pathname: string): boolean => ASSETS.includes(pathname);

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

	// The fetch strategy has exactly two regimes, chosen by the pathname of
	// the worker's own ASSETS list:
	//
	// 1. install-set assets (hashed build files, fonts, icons, the small
	//    data JSONs) — cache-first, since the URL list and the cache name
	//    arrive with the same `version` and never cross a deploy;
	// 2. everything else — page HTML, __data.json data requests,
	//    _app/version.json (which Kit's update check depends on),
	//    cross-origin scripts — a pass-through: no respondWith, so the
	//    browser fetches natively, exactly as if no worker existed.
	//
	// NO runtime caching of any kind. The original handler cached every
	// 200 it saw (pages, data URLs with query variants, even cross-origin
	// responses, which the Cache API rejects outright), so months of
	// browsing filled phones' storage quota until cache operations began
	// failing inside the worker — every intercepted request then failed at
	// once, SvelteKit committed its error branch without the
	// version-mismatch reload fallback (fresh app ⇒ versions match), and
	// navigation went dead until a full refresh. The May 2026 fix d5bc2ae
	// ("Actually fix service worker :|") corrected this same failure class
	// at eager-cache scale; the pass-through restores that corrected
	// invariant permanently.
	if (!isInstallAsset(url.pathname)) {
		return;
	}

	async function respond(): Promise<Response> {
		// Cache first — and only touch the cache for asset requests, so a
		// storage failure (quota, private mode) degrades to a plain network
		// fetch instead of failing the request.
		let networkError: unknown;
		try {
			const cache = await caches.open(CACHE);
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
		const offline = await caches
			.open(CACHE)
			.then((cache) => cache.match(url.pathname))
			.catch(() => undefined);
		if (offline) return offline;
		throw networkError;
	}

	event.respondWith(respond());
});
