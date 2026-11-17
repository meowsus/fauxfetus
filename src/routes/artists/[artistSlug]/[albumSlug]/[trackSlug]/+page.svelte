<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import MetadataTable from '$lib/components/MetadataTable.svelte';
	import {
		canonicalUrl,
		jsonLdBreadcrumb,
		jsonLdMusicRecording,
		jsonLdScript,
		ogMeta
	} from '$lib/helpers/seo';
	import { asset } from '$app/paths';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import { getPlayerContext, getPlayerActions } from '$lib/context/player';

	let { data }: { data: PageData } = $props();

	const playerStore = getPlayerContext();
	const actionsStore = getPlayerActions();

	// The page's subject is what the persistent pill is playing.
	const isCurrent = $derived(
		$playerStore.currentTrackIndex != null &&
			$playerStore.playlist[$playerStore.currentTrackIndex]?.audioUrl === data.track.audioUrl
	);

	function handlePlay() {
		$actionsStore.loadPlaylist(data.playlist, data.startIndex, { isRadio: false });
	}

	// All of the following depend on `data`, which SvelteKit updates in place
	// when navigating between tracks under the same album/artist (or
	// otherwise reusing this page component). A plain `const` would capture
	// the first track's data and go stale, so these must be `$derived`.
	const artistHref = $derived(`/artists/${data.track.artistSlug}` as const);
	const albumHref = $derived(`${artistHref}/${data.track.albumSlug}` as const);
	const audioFilename = $derived(data.track.audioUrl.split('/').pop() || 'track.mp3');
	const trackNumber = $derived(data.track.number ?? data.startIndex + 1);
	const trackNumberLabel = $derived(trackNumber < 10 ? `0${trackNumber}` : String(trackNumber));

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

<Breadcrumb items={breadcrumbItems} />

<div class="mast">
	<h1>{data.track.name}</h1>
	<p class="byline">
		<span class="who">
			by <a href={resolve(artistHref)}>{data.track.artistName}</a>
		</span>
		<a
			class="dl"
			href={asset(`/audio/${data.track.audioUrl}`)}
			download={audioFilename}
			rel="nofollow"
		>
			download mp3 ↓
		</a>
	</p>
</div>

<ol class="now-playing">
	<li>
		<button type="button" onclick={handlePlay}>
			<span class="no tnum dim">{trackNumberLabel}</span>
			<span class="trname">{data.track.name}</span>
			{#if isCurrent}
				<span class="cap now">now playing</span>
			{/if}
		</button>
	</li>
</ol>

<MetadataTable
	metadata={data.metadata}
	links={{ artist: artistHref, album: albumHref }}
	trackLabel={`${trackNumber} of ${data.playlist.length}`}
/>
