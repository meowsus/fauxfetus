<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import TrackList from '$lib/components/TrackList.svelte';
	import { canonicalUrl, jsonLdBreadcrumb, jsonLdMusicAlbum, ogMeta } from '$lib/helpers/seo';
	import JsonLd from '$lib/components/JsonLd.svelte';

	let { data }: { data: PageData } = $props();

	const artistHref: `/artists/${string}` = `/artists/${data.album.artistSlug}`;
	const breadcrumbItems = [
		{ name: 'Home', href: '/' as const },
		{ name: 'Artists', href: '/artists' as const },
		{ name: data.album.artistName, href: artistHref },
		{ name: data.album.name }
	];

	const pageUrl = canonicalUrl(`/artists/${data.album.artistSlug}/${data.album.slug}/`);
	const pageTitle = `${data.album.name} by ${data.album.artistName} - Faux Fetus`;
	const pageDescription = `Listen to tracks from the album ${data.album.name} by ${data.album.artistName} on Faux Fetus.`;
	const ogTags = ogMeta({
		title: pageTitle,
		description: pageDescription,
		url: pageUrl
	});
	const albumLd = jsonLdMusicAlbum({
		name: data.album.name,
		slug: data.album.slug,
		artistSlug: data.album.artistSlug,
		artistName: data.album.artistName,
		tracks: data.album.tracks.map((t: { name: string; slug: string; number: number | null }) => ({
			name: t.name,
			slug: t.slug,
			number: t.number
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

<JsonLd data={albumLd} />
<JsonLd data={breadcrumbLd} />

<div class="flex flex-col gap-2">
	<Breadcrumb items={breadcrumbItems} />
	<h1 class="sr-only">{data.album.name}</h1>
	<TrackList tracks={data.album.tracks} shouldDisableRadioMode={true} />
</div>
