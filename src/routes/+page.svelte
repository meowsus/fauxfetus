<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
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

<h1>Faux Fetus</h1>

<p><a href={resolve('/artists/')}>Browse artists &rarr;</a></p>

<section>
	<h2>Latest news</h2>
	<article>
		<!-- Server-rendered HTML from trusted markdown -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html data.html}
	</article>
</section>
