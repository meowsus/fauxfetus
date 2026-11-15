<script lang="ts">
	import { resolve } from '$app/paths';
	import { SvelteMap } from 'svelte/reactivity';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import { formatDateLong } from '$lib/helpers/format-date';
	import {
		canonicalUrl,
		jsonLdBreadcrumb,
		jsonLdCollectionPage,
		jsonLdScript,
		ogMeta
	} from '$lib/helpers/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const pageUrl = canonicalUrl('/news/');
	const pageTitle = 'News';
	const pageDescription = 'Every update to Faux Fetus: releases, fixes, and assorted ramblings.';
	const ogTags = ogMeta({
		title: pageTitle,
		description: pageDescription,
		url: pageUrl
	});
	const collectionLd = jsonLdCollectionPage(pageUrl, 'News');
	const breadcrumbLd = jsonLdBreadcrumb([{ name: 'Home', href: '/' as const }, { name: 'News' }]);

	// Posts arrive newest-first from the load; insertion order preserves it
	// per year bucket.
	const yearGroups = $derived.by(() => {
		const map = new SvelteMap<number, PageData['posts']>();
		for (const post of data.posts) {
			const year = Number(post.date.slice(0, 4));
			const bucket = map.get(year) ?? [];
			bucket.push(post);
			map.set(year, bucket);
		}
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

<Breadcrumb items={[{ name: 'Home', href: '/' as const }, { name: 'News' }]} />
<h1>News</h1>

{#each yearGroups as [year, posts] (year)}
	<section aria-labelledby={`news-${year}`}>
		<h2 id={`news-${year}`}>{year}</h2>
		<ol>
			{#each posts as post (post.slug)}
				<li>
					<article>
						<h3>
							<a href={resolve(`/news/${post.slug}`)}>{post.title}</a>
						</h3>
						<time datetime={post.date}>{formatDateLong(post.date)}</time>
						<p>{post.excerpt}</p>
					</article>
				</li>
			{/each}
		</ol>
	</section>
{/each}
