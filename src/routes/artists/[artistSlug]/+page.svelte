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

	const formatCount = (value: number): string => value.toLocaleString('en-US');

	// These must be derived from `data` so they refresh when SvelteKit swaps
	// in new data for a same-route navigation (e.g. clicking a related
	// artist). A plain `const` would capture the first artist's data and
	// never update, leaving the breadcrumbs/SEO/JSON-LD stale.
	const albumCount = $derived(data.artist.albums.length);
	const trackCount = $derived(data.artist.albums.reduce((sum, album) => sum + album.trackCount, 0));
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

<Breadcrumb items={breadcrumbItems} />

<div class="mast">
	<h1>{data.artist.name}</h1>
	<p class="sub">
		<b>{formatCount(albumCount)}</b>
		{albumCount === 1 ? 'album' : 'albums'} ·
		<b>{formatCount(trackCount)}</b>
		{trackCount === 1 ? 'track' : 'tracks'}
	</p>
</div>

<section aria-labelledby="h-albums">
	<h2 class="lbl" id="h-albums">Albums</h2>
	<AlbumList albums={data.artist.albums} />
</section>

{#if data.recommendedArtists.length > 0}
	<section class="afterthought" aria-labelledby="h-related">
		<h2 class="cap dim" id="h-related">Related artists</h2>
		<RelatedArtistList artists={data.recommendedArtists} />
	</section>
{/if}

<style>
	section {
		margin-top: 4.5rem;
	}

	/* the related line is an afterthought: it tucks in sooner than the
	   album ledger, and its label wears the metadata voice, not the .lbl */
	.afterthought {
		margin-top: 3.2rem;
	}
</style>
