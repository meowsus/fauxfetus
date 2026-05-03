/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, version } from '$service-worker';

const self = globalThis as unknown as ServiceWorkerGlobalScope;
const CACHE = `cache-${version}`;

const ASSETS = [...build, ...files].filter((url) => {
	const pathname = new URL(url, self.location.origin).pathname;
	return pathname.startsWith('/audio') && pathname === '/catalog.json';
});

self.addEventListener('install', (event: ExtendableEvent) => {
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
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}
	event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event: FetchEvent) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);

	// Pass audio requests directly to the network; don't cache them
	if (url.pathname.startsWith('/audio')) {
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
