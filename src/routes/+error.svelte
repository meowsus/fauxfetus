<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { canonicalUrl, ogMeta } from '$lib/helpers/seo';

	const status = page.status;
	const message = page.error?.message ?? 'Page not found';

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

<h1>{pageTitle}</h1>
<p>{message}</p>
<p><a href={resolve('/')}>Go Home</a></p>
