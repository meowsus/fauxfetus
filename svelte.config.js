import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({ fallback: '404.html' }),
		version: { name: pkg.version },
		prerender: {
			handleHttpError: ({ path, message }) => {
				// PWA icons are optional; user adds them to static/icons/
				if (path.startsWith('/icons/')) return;
				throw new Error(message);
			}
		}
	}
};

export default config;
