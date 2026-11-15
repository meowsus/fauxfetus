<script lang="ts">
	import { resolve } from '$app/paths';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import { formatDateLong } from '$lib/helpers/format-date';
	import {
		canonicalUrl,
		jsonLdBlogPosting,
		jsonLdBreadcrumb,
		jsonLdScript,
		ogMeta
	} from '$lib/helpers/seo';
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

<article>
	<header>
		<h1>{data.post.title}</h1>
		<time datetime={data.post.date}>{formatDateLong(data.post.date)}</time>
	</header>

	{#if data.post.music.length > 0}
		<section aria-labelledby="added-to-catalog">
			<h2 id="added-to-catalog">Added to the catalog</h2>
			<ul>
				{#each data.post.music as group (group.artistSlug)}
					<li>
						<a href={resolve(`/artists/${group.artistSlug}`)}>{group.artistName}</a>
						{#if group.albums.length > 0}
							<ul>
								{#each group.albums as album (album.slug)}
									<li>
										<a href={resolve(`/artists/${group.artistSlug}/${album.slug}`)}>{album.name}</a>
									</li>
								{/each}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<!-- Server-rendered HTML from trusted markdown -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html data.post.html}
</article>
