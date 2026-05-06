<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import ArtistList from '$lib/components/ArtistList.svelte';
	import {
		canonicalUrl,
		jsonLdBreadcrumb,
		jsonLdCollectionPage,
		jsonLdScript,
		ogMeta
	} from '$lib/helpers/seo';
	import JsonLd from '$lib/components/JsonLd.svelte';

	let { data }: { data: PageData } = $props();

	const breadcrumbItems = [{ name: 'Home', href: '/' as const }, { name: 'Artists' }];

	const pageUrl = canonicalUrl('/artists/');
	const pageTitle = 'Artists';
	const pageDescription = 'Browse the collection of experimental music artists on Faux Fetus.';
	const ogTags = ogMeta({
		title: pageTitle,
		description: pageDescription,
		url: pageUrl
	});
	const collectionLd = jsonLdCollectionPage(pageUrl, 'Artists');
	const breadcrumbLd = jsonLdBreadcrumb(breadcrumbItems);
</script>

<svelte:head>
	<title>{pageTitle} - Faux Fetus</title>
	<meta name="description" content={pageDescription} />
	<link rel="canonical" href={pageUrl} />
	{#each Object.entries(ogTags) as [property, content] (property)}
		<meta {property} {content} />
	{/each}
</svelte:head>

<JsonLd html={jsonLdScript(collectionLd)} />
<JsonLd html={jsonLdScript(breadcrumbLd)} />

<div class="flex flex-col gap-2">
	<Breadcrumb items={breadcrumbItems} />
	<h1 class="sr-only">Artists</h1>
	<ArtistList artists={data.artists} />
</div>
