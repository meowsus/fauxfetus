/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, version } from '$service-worker';

// SAFETY: inside a service worker, globalThis is the
// ServiceWorkerGlobalScope per spec; the lib references above type it.
const self = globalThis as unknown as ServiceWorkerGlobalScope;
const CACHE = `cache-${version}`;

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
		// Delete old caches from previous versions
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

	async function respond(): Promise<Response> {
		const cache = await caches.open(CACHE);

		if (ASSETS.includes(url.pathname)) {
			const response = await cache.match(url.pathname);
			if (response) return response;
		}

		try {
			const response = await fetch(event.request);
			if (!(response instanceof Response)) {
				throw new Error('invalid response from fetch');
			}
			if (response.status === 200) {
				cache.put(event.request, response.clone());
			}
			return response;
		} catch (err) {
			const response = await cache.match(event.request);
			if (response) return response;
			throw err;
		}
	}

	event.respondWith(respond());
});
