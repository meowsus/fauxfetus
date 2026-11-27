<script lang="ts">
	import { resolve } from '$app/paths';
	import { SvelteMap } from 'svelte/reactivity';
	import Breadcrumb from '#lib/components/Breadcrumb.svelte';
	import JsonLd from '#lib/components/JsonLd.svelte';
	import { formatDateMonthDay } from '#lib/helpers/format-date.js';
	import {
		canonicalUrl,
		jsonLdBreadcrumb,
		jsonLdCollectionPage,
		jsonLdScript,
		ogMeta
	} from '#lib/helpers/seo.js';
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

<div class="mast">
	<h1>news</h1>
	<p class="sub">
		<b><span class="tnum">{data.posts.length}</span></b> posts since the relaunch · every one, nothing
		trimmed
	</p>
</div>

<ol class="years">
	{#each yearGroups as [year, posts] (year)}
		<li class="year">
			<h2 class="yr">
				{year}
				<span class="dim tnum">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>
			</h2>
			<ol class="entries">
				{#each posts as post (post.slug)}
					<li>
						<a href={resolve(`news/${post.slug}`)}>
							<span class="cap dim tnum dt">{formatDateMonthDay(post.date)}</span>
							<h3>{post.title} →</h3>
							<p class="excerpt">{post.excerpt}</p>
						</a>
					</li>
				{/each}
			</ol>
		</li>
	{/each}
</ol>
