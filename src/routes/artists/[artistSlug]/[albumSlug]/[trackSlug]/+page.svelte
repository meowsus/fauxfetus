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

	const artistHref: `/artists/${string}` = `/artists/${data.track.artistSlug}`;
	const albumHref: `/artists/${string}/${string}` = `${artistHref}/${data.track.albumSlug}`;

	const breadcrumbItems = [
		{ name: 'Home', href: '/' as const },
		{ name: 'Artists', href: '/artists' as const },
		{ name: data.track.artistName, href: artistHref },
		{ name: data.track.albumName, href: albumHref },
		{ name: data.track.name }
	];

	const pageUrl = canonicalUrl(
		`/artists/${data.track.artistSlug}/${data.track.albumSlug}/${data.track.slug}/`
	);
	const pageTitle = `${data.track.name} by ${data.track.artistName} - Faux Fetus`;
	const pageDescription = `Listen to ${data.track.name} from the album ${data.track.albumName} by ${data.track.artistName} on Faux Fetus.`;
	const ogTags = ogMeta({
		title: pageTitle,
		description: pageDescription,
		url: pageUrl
	});
	const trackLd = jsonLdMusicRecording({
		name: data.track.name,
		slug: data.track.slug,
		artistSlug: data.track.artistSlug,
		artistName: data.track.artistName,
		albumSlug: data.track.albumSlug,
		albumName: data.track.albumName
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
