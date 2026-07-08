<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import AlbumList from '$lib/components/AlbumList.svelte';
	import RelatedArtistList from '$lib/components/RelatedArtistList.svelte';
	import {
		canonicalUrl,
		jsonLdBreadcrumb,
		jsonLdMusicGroup,
		jsonLdRelatedArtists,
		jsonLdScript,
		ogMeta
	} from '$lib/helpers/seo';
	import JsonLd from '$lib/components/JsonLd.svelte';

	let { data }: { data: PageData } = $props();

	// These must be derived from `data` so they refresh when SvelteKit swaps
	// in new data for a same-route navigation (e.g. clicking a related
	// artist). A plain `const` would capture the first artist's data and
	// never update, leaving the breadcrumbs/SEO/JSON-LD stale.
	const breadcrumbItems = $derived([
		{ name: 'Home', href: '/' as const },
		{ name: 'Artists', href: '/artists' as const },
		{ name: data.artist.name }
	]);

	const pageUrl = $derived(canonicalUrl(`/artists/${data.artist.slug}/`));
	const pageTitle = $derived(`${data.artist.name} - Faux Fetus`);
	const pageDescription = $derived(`Browse albums by ${data.artist.name} on Faux Fetus.`);
	const ogTags = $derived(
		ogMeta({
			title: pageTitle,
			description: pageDescription,
			url: pageUrl
		})
	);
	const musicGroupLd = $derived(
		jsonLdMusicGroup({
			name: data.artist.name,
			slug: data.artist.slug,
			albums: data.artist.albums.map((a) => ({
				name: a.name,
				slug: a.slug
			}))
		})
	);
	const breadcrumbLd = $derived(jsonLdBreadcrumb(breadcrumbItems));
	const relatedArtistsLd = $derived(
		data.recommendedArtists.length > 0
			? jsonLdRelatedArtists(
					{ name: data.artist.name, slug: data.artist.slug },
					data.recommendedArtists
				)
			: null
	);
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
{#if relatedArtistsLd}
	<JsonLd html={jsonLdScript(relatedArtistsLd)} />
{/if}

<div class="flex flex-col gap-2 md:grid md:grid-cols-3 md:gap-4">
	<div class="md:col-span-3">
		<Breadcrumb items={breadcrumbItems} />
	</div>
	<h1 class="sr-only">{data.artist.name}</h1>
	<div class={data.recommendedArtists.length > 0 ? 'md:col-span-2' : 'md:col-span-3'}>
		<AlbumList albums={data.artist.albums} />
	</div>
	{#if data.recommendedArtists.length > 0}
		<div class="md:col-span-1">
			<RelatedArtistList artists={data.recommendedArtists} />
		</div>
	{/if}
</div>
