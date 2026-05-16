import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'child_process';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';

const gitSha = execSync('git rev-parse --short HEAD').toString().trim();

export default defineConfig({
	define: {
		__GIT_SHA__: JSON.stringify(gitSha)
	},
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
	server: {
		// Allow access from other devices on your local network
		host: true
	},
	preview: {
		// Allow access from other devices on your local network (for post-build testing)
		host: true
	}
});
