<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import MetadataTable from '$lib/components/MetadataTable.svelte';
	import TrackRow from '$lib/components/TrackRow.svelte';
	import {
		canonicalUrl,
		jsonLdBreadcrumb,
		jsonLdMusicRecording,
		jsonLdScript,
		ogMeta
	} from '$lib/helpers/seo';
	import JsonLd from '$lib/components/JsonLd.svelte';

	let { data }: { data: PageData } = $props();

	// All of the following depend on `data`, which SvelteKit updates in place
	// when navigating between tracks under the same album/artist (or
	// otherwise reusing this page component). A plain `const` would capture
	// the first track's data and go stale, so these must be `$derived`.
	const artistHref = $derived(`/artists/${data.track.artistSlug}` as const);
	const albumHref = $derived(`${artistHref}/${data.track.albumSlug}` as const);

	const breadcrumbItems = $derived([
		{ name: 'Home', href: '/' as const },
		{ name: 'Artists', href: '/artists' as const },
		{ name: data.track.artistName, href: artistHref },
		{ name: data.track.albumName, href: albumHref },
		{ name: data.track.name }
	]);

	const pageUrl = $derived(
		canonicalUrl(`/artists/${data.track.artistSlug}/${data.track.albumSlug}/${data.track.slug}/`)
	);
	const pageTitle = $derived(`${data.track.name} by ${data.track.artistName} - Faux Fetus`);
	const pageDescription = $derived(
		`Listen to ${data.track.name} from the album ${data.track.albumName} by ${data.track.artistName} on Faux Fetus.`
	);
	const ogTags = $derived(
		ogMeta({
			title: pageTitle,
			description: pageDescription,
			url: pageUrl
		})
	);
	const trackLd = $derived(
		jsonLdMusicRecording({
			name: data.track.name,
			slug: data.track.slug,
			artistSlug: data.track.artistSlug,
			artistName: data.track.artistName,
			albumSlug: data.track.albumSlug,
			albumName: data.track.albumName
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

<JsonLd html={jsonLdScript(trackLd)} />
<JsonLd html={jsonLdScript(breadcrumbLd)} />

<div class="flex flex-col gap-4">
	<Breadcrumb items={breadcrumbItems} />
	<h1 class="sr-only">{data.track.name}</h1>

	<ul class="list rounded-box bg-base-100 shadow-md">
		<TrackRow
			track={data.track}
			index={data.startIndex}
			playlist={data.playlist}
			shouldDisableRadioMode={true}
		/>
	</ul>

	<MetadataTable metadata={data.metadata} />
</div>
