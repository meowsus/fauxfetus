<script lang="ts">
	import { resolve } from '$app/paths';
	import { SvelteMap } from 'svelte/reactivity';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import {
		canonicalUrl,
		jsonLdBreadcrumb,
		jsonLdCollectionPage,
		jsonLdScript,
		ogMeta
	} from '$lib/helpers/seo';
	import type { PageData } from './$types';

	type AlbumEntry = {
		slug: string;
		name: string;
		artistSlug: string;
		artistName: string;
		isCompilation: boolean;
	};

	let { data }: { data: PageData } = $props();

	const breadcrumbItems = [{ name: 'Home', href: '/' as const }, { name: 'Albums' }];

	const pageUrl = canonicalUrl('/albums/');
	const pageTitle = 'Albums';
	const pageDescription = 'Browse every album in the Faux Fetus collection, alphabetically.';
	const ogTags = ogMeta({
		title: pageTitle,
		description: pageDescription,
		url: pageUrl
	});
	const collectionLd = jsonLdCollectionPage(pageUrl, 'Albums');
	const breadcrumbLd = jsonLdBreadcrumb(breadcrumbItems);

	/** Group letter = first character of the title; titles that don't start
	 * with A-Z (digits, symbols) bucket under '#'. */
	const letterFor = (album: AlbumEntry): string => {
		const first = album.name.charAt(0).toUpperCase();
		return /[A-Z]/.test(first) ? first : '#';
	};

	const anchorFor = (letter: string): string => (letter === '#' ? 'other' : letter.toLowerCase());

	const groups = $derived.by(() => {
		const map = new SvelteMap<string, AlbumEntry[]>();
		for (const album of data.albums) {
			const letter = letterFor(album);
			const bucket = map.get(letter) ?? [];
			bucket.push(album);
			map.set(letter, bucket);
		}
		// Insertion order preserves the alphabetical sort from the load.
		return [...map.entries()];
	});
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

<Breadcrumb items={breadcrumbItems} />
<h1>Albums</h1>

<nav aria-label="Jump to letter">
	<ol>
		{#each groups as [letter] (letter)}
			<li><a href="#{anchorFor(letter)}">{letter}</a></li>
		{/each}
	</ol>
</nav>

{#each groups as [letter, albums] (letter)}
	<section>
		<h2 id={anchorFor(letter)}>{letter === '#' ? '#' : letter}</h2>
		<ul>
			{#each albums as album (`${album.artistSlug}/${album.slug}`)}
				<li>
					<a href={resolve(`/artists/${album.artistSlug}/${album.slug}`)}>{album.name}</a>
					<span>— {album.artistName}</span>
					{#if album.isCompilation}
						<small>Compilation</small>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/each}
