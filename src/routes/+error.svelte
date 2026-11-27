<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { canonicalUrl, ogMeta } from '#lib/helpers/seo.js';

	const status = page.status;
	const message = $derived(page.error?.message ?? 'Page not found');

	const pageTitle = status === 404 ? '404 - Page Not Found' : `${status} - Error`;
	const pageDescription =
		status === 404 ? 'The page you are looking for does not exist.' : 'Something went wrong.';
	const pageUrl = canonicalUrl(page.url.pathname);
	const ogTags = ogMeta({
		title: pageTitle,
		description: pageDescription,
		url: pageUrl
	});
</script>

<svelte:head>
	<title>{pageTitle} | Faux Fetus</title>
	<meta name="description" content={pageDescription} />
	<meta name="robots" content="noindex, follow" />
	<link rel="canonical" href={pageUrl} />
	{#each Object.entries(ogTags) as [property, content] (property)}
		<meta {property} {content} />
	{/each}
</svelte:head>

<div class="mast">
	<h1>{status ?? 'error'}</h1>
</div>
<p class="note">{message}</p>
<p class="endcap"><a class="cap" href={resolve('/')}>← Home</a></p>

<style>
	/* the status page sits well below the chrome; the masthead air is too
	   generous for an error, so it keeps the album page's tight pacing */
	.mast {
		padding-block: 1.6rem 0;
	}

	.note {
		margin-top: 1.4rem;
		max-width: 46ch;
	}
</style>
