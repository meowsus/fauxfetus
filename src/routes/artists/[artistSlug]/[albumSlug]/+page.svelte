<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import Breadcrumb from '#lib/components/Breadcrumb.svelte';
	import TrackList from '#lib/components/TrackList.svelte';
	import {
		canonicalUrl,
		jsonLdBreadcrumb,
		jsonLdMusicAlbum,
		jsonLdScript,
		ogMeta
	} from '#lib/helpers/seo.js';
	import JsonLd from '#lib/components/JsonLd.svelte';
	import { albumZipPath } from '#lib/helpers/downloads.js';
	import { asset } from '$app/paths';

	let { data }: { data: PageData } = $props();

	// All of the following depend on `data`, which SvelteKit updates in place
	// when navigating between albums under the same artist (or otherwise
	// reusing this page component). A plain `const` would capture the first
	// album's data and go stale, so these must be `$derived`.
	const artistHref = $derived(`artists/${data.album.artistSlug}` as const);
	const zipPath = $derived(albumZipPath(data.album.artistSlug, data.album.slug));
	const breadcrumbItems = $derived([
		{ name: 'Home', href: '/' as const },
		{ name: 'Artists', href: '/artists' as const },
		{ name: data.album.artistName, href: artistHref },
		{ name: data.album.name }
	]);

	const pageUrl = $derived(canonicalUrl(`artists/${data.album.artistSlug}/${data.album.slug}/`));
	const pageTitle = $derived(`${data.album.name} by ${data.album.artistName} - Faux Fetus`);
	const pageDescription = $derived(
		`Listen to tracks from the album ${data.album.name} by ${data.album.artistName} on Faux Fetus.`
	);
	const ogTags = $derived(
		ogMeta({
			title: pageTitle,
			description: pageDescription,
			url: pageUrl
		})
	);
	const albumLd = $derived(
		jsonLdMusicAlbum({
			name: data.album.name,
			slug: data.album.slug,
			artistSlug: data.album.artistSlug,
			artistName: data.album.artistName,
			tracks: data.album.tracks.map((t) => ({
				name: t.name,
				slug: t.slug,
				number: t.number
			}))
		})
	);
	const breadcrumbLd = $derived(jsonLdBreadcrumb(breadcrumbItems));
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<link rel="canonical" href={pageUrl} />
	{#each Object.entries(ogTags) as [property, content] (property)}
		<meta {property} {content} />
	{/each}
</svelte:head>

<JsonLd html={jsonLdScript(albumLd)} />
<JsonLd html={jsonLdScript(breadcrumbLd)} />

<Breadcrumb items={breadcrumbItems} />

<div class="mast">
	<h1>{data.album.name}</h1>
	<p class="byline">
		<span class="who">by <a href={resolve(artistHref)}>{data.album.artistName}</a></span>
		<!-- rel="external" is load-bearing: the dl/ sidecar is server-only PHP at
			fauxfetus.net/dl/ (404s during prerender); SvelteKit's crawler skips
			rel="external" links, which silences the [404] GET build spam. -->
		<a
			class="dl"
			href={asset(zipPath as Parameters<typeof asset>[0])}
			download
			rel="nofollow external"
		>
			download zip ↓
		</a>
	</p>
</div>

<TrackList tracks={data.album.tracks} />
