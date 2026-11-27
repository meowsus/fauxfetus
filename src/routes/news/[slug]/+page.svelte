<script lang="ts">
	import { resolve } from '$app/paths';
	import Breadcrumb from '#lib/components/Breadcrumb.svelte';
	import JsonLd from '#lib/components/JsonLd.svelte';
	import { formatDateLong } from '#lib/helpers/format-date.js';
	import {
		canonicalUrl,
		jsonLdBlogPosting,
		jsonLdBreadcrumb,
		jsonLdScript,
		ogMeta
	} from '#lib/helpers/seo.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const breadcrumbItems = $derived([
		{ name: 'Home', href: '/' as const },
		{ name: 'News', href: '/news' as const },
		{ name: data.post.title }
	]);

	const pageUrl = $derived(canonicalUrl(`/news/${data.post.slug}/`));
	const pageTitle = $derived(`${data.post.title} - Faux Fetus`);
	const pageDescription = $derived(data.post.excerpt);
	const ogTags = $derived(
		ogMeta({
			title: data.post.title,
			description: data.post.excerpt,
			url: pageUrl,
			type: 'article'
		})
	);
	const postLd = $derived(
		jsonLdBlogPosting({
			title: data.post.title,
			slug: data.post.slug,
			date: data.post.date,
			excerpt: data.post.excerpt
		})
	);
	const breadcrumbLd = $derived(jsonLdBreadcrumb(breadcrumbItems));
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<link rel="canonical" href={pageUrl} />
	<meta property="article:published_time" content={data.post.date} />
	{#each Object.entries(ogTags) as [property, content] (property)}
		<meta {property} {content} />
	{/each}
</svelte:head>

<JsonLd html={jsonLdScript(postLd)} />
<JsonLd html={jsonLdScript(breadcrumbLd)} />

<Breadcrumb items={breadcrumbItems} />

<div class="kicker tnum">
	<a class="cap dim" href={resolve('news/')}>News</a>
	<div class="right">
		<time class="cap dim" datetime={data.post.date}>{formatDateLong(data.post.date)}</time>
	</div>
</div>

<div class="mast">
	<h1>{data.post.title}</h1>
</div>

<div class="prose">
	<!-- Server-rendered HTML from trusted markdown -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html data.post.html}
</div>

{#if data.post.music.length > 0}
	<section aria-labelledby="h-music">
		<h2 class="lbl" id="h-music">New in the catalog</h2>
		<ul class="music">
			{#each data.post.music as group (group.artistSlug)}
				<li>
					<a href={resolve(`artists/${group.artistSlug}`)}>{group.artistName}</a>
					{#if group.albums.length > 0}
						<span class="albs">
							{#each group.albums as album (album.slug)}
								<a href={resolve(`artists/${group.artistSlug}/${album.slug}`)}>
									— {album.name}
									<span class="track-count">
										· {album.trackCount}
										{album.trackCount === 1 ? 'track' : 'tracks'}
									</span>
								</a>
							{/each}
						</span>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	section {
		margin-top: 4.5rem;
	}
</style>
