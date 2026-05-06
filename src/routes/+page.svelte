<script lang="ts">
	import type { PageData } from './$types';
	import {
		canonicalUrl,
		jsonLdBreadcrumb,
		jsonLdScript,
		jsonLdWebsite,
		ogMeta
	} from '$lib/helpers/seo';
	import JsonLd from '$lib/components/JsonLd.svelte';

	let { data }: { data: PageData } = $props();

	const pageUrl = canonicalUrl('/');
	const pageTitle = 'Faux Fetus — Experimental Music Collective';
	const pageDescription =
		"A collection of experimental music you never heard of or even want to listen to made by people you don't care about.";
	const ogTags = ogMeta({
		title: pageTitle,
		description: pageDescription,
		url: pageUrl,
		type: 'website'
	});
	const webSiteLd = jsonLdWebsite();
	const breadcrumbLd = jsonLdBreadcrumb([{ name: 'Home', href: '/' }]);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<link rel="canonical" href={pageUrl} />
	{#each Object.entries(ogTags) as [property, content] (property)}
		<meta {property} {content} />
	{/each}
</svelte:head>

<JsonLd html={jsonLdScript(webSiteLd)} />
<JsonLd html={jsonLdScript(breadcrumbLd)} />

<h1 class="sr-only">Faux Fetus</h1>

<article
	class="prose prose-base max-w-none py-8 md:prose-lg dark:prose-invert prose-headings:text-base-content/80 prose-a:text-primary prose-a:underline prose-a:decoration-primary prose-a:underline-offset-2 prose-a:hover:opacity-80"
>
	<!-- Server-rendered HTML from trusted markdown -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html data.html}
</article>
