// Patches the adapter-static fallback (build/404.html) so users without
// JavaScript still get a usable, accessible 404 page.
//
// Why: adapter-static's fallback is a bare SPA shell — no <title>, no body
// content. The SvelteKit router hydrates +error.svelte client-side, which
// covers JS users, but no-JS users (including some assistive-tech setups)
// would otherwise see a blank page, and the document has no <title> at all
// (axe: document-title).
//
// Idempotent: patching an already-patched file is a no-op.
//
// The static content lives inside <noscript> in the hydration target —
// JS users get the hydrated error page, with zero hydration-conflict risk.

import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../../build/404.html', import.meta.url);
let html = readFileSync(file, 'utf8');

if (html.includes('data-404-fallback')) {
	console.log('404.html already patched; nothing to do');
	process.exit(0);
}

const title = '404 - Page Not Found | Faux Fetus';
const noscript = `<noscript data-404-fallback>
	<div class="mast">
		<h1>404</h1>
	</div>
	<p class="note">The page you are looking for does not exist on fauxfetus.net.</p>
	<p class="endcap"><a class="cap" href="/">← Home</a></p>
</noscript>`;

// <title> belongs at the top of <head>; anchor it to the viewport meta.
// Matched structurally (not verbatim) so attribute changes to the meta —
// e.g. adding viewport-fit=cover for PWA safe areas — don't break the patch.
const viewport = /<meta\s+name="viewport"[^>]*>/;
if (!viewport.test(html)) {
	throw new Error('patch-404-fallback: viewport meta not found in build/404.html');
}
html = html.replace(viewport, (match) => `${match}\n\t\t<title>${title}</title>`);

// Insert the static content at the top of the hydration target div.
const target = '<div style="display: contents">';
if (!html.includes(target)) {
	throw new Error('patch-404-fallback: hydration target div not found in build/404.html');
}
html = html.replace(target, `${target}\n\t\t\t${noscript}`);

writeFileSync(file, html);
console.log('patched 404.html with static fallback content');
