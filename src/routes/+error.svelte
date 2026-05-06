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

<div class="flex flex-col items-center justify-center gap-6 py-16">
	<h1 class="text-6xl font-bold text-base-content/30">{status}</h1>
	<p class="text-xl text-base-content/60">{message}</p>
	<a href={resolve('/')} class="btn btn-primary">Go Home</a>
</div>
