<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import AlbumList from '$lib/components/AlbumList.svelte';
	import {
		canonicalUrl,
		jsonLdBreadcrumb,
		jsonLdMusicGroup,
		jsonLdScript,
		ogMeta
	} from '$lib/helpers/seo';
	import JsonLd from '$lib/components/JsonLd.svelte';

	let { data }: { data: PageData } = $props();

	const breadcrumbItems = [
		{ name: 'Home', href: '/' as const },
		{ name: 'Artists', href: '/artists' as const },
		{ name: data.artist.name }
	];

	const pageUrl = canonicalUrl(`/artists/${data.artist.slug}/`);
	const pageTitle = `${data.artist.name} - Faux Fetus`;
	const pageDescription = `Browse albums by ${data.artist.name} on Faux Fetus.`;
	const ogTags = ogMeta({
		title: pageTitle,
		description: pageDescription,
		url: pageUrl
	});
	const musicGroupLd = jsonLdMusicGroup({
		name: data.artist.name,
		slug: data.artist.slug,
		albums: data.artist.albums.map((a) => ({
			name: a.name,
			slug: a.slug
		}))
	});
	const breadcrumbLd = jsonLdBreadcrumb(breadcrumbItems);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<link rel="canonical" href={pageUrl} />
	{#each Object.entries(ogTags) as [property, content] (property)}
		<meta {property} {content} />
	{/each}
</svelte:head>

<JsonLd html={jsonLdScript(musicGroupLd)} />
<JsonLd html={jsonLdScript(breadcrumbLd)} />

<div class="flex flex-col gap-2">
	<Breadcrumb items={breadcrumbItems} />
	<h1 class="sr-only">{data.artist.name}</h1>
	<AlbumList albums={data.artist.albums} />
</div>
