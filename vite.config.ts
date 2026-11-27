import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';

const gitSha = execSync('git rev-parse --short HEAD').toString().trim();
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// SvelteKit 3: svelte.config.js no longer exists — every option that used to
// live in config.kit.* (plus Svelte options like preprocess) is passed
// directly to the sveltekit() Vite plugin.
export default defineConfig({
	define: {
		__GIT_SHA__: JSON.stringify(gitSha)
	},
	plugins: [
		sveltekit({
			preprocess: vitePreprocess(),
			adapter: adapter({ fallback: '404.html' }),
			version: { name: pkg.version },
			prerender: {
				handleHttpError: ({ path, message }) => {
					// PWA icons are optional; user adds them to static/icons/
					if (path.startsWith('/icons/')) return;
					// The dl/ sidecar exists only on the deployed server; download
					// buttons link there but nothing serves it during prerendering.
					if (path.startsWith('/dl/')) return;
					throw new Error(message);
				}
			}
		}),
		devtoolsJson()
	],
	server: {
		// Allow access from other devices on your local network
		host: true
	},
	preview: {
		// Allow access from other devices on your local network (for post-build testing)
		host: true
	}
});
