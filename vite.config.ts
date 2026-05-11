import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';

export default defineConfig({
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
