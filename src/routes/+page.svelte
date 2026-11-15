<script lang="ts">
	import { resolve } from '$app/paths';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import { formatDateLong } from '$lib/helpers/format-date';
	import {
		canonicalUrl,
		jsonLdBreadcrumb,
		jsonLdScript,
		jsonLdWebsite,
		ogMeta
	} from '$lib/helpers/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const pageUrl = canonicalUrl('/');
	const pageTitle = 'Faux Fetus: Experimental Music Collective';
	const pageDescription =
		"A collection of experimental music you never heard of or even want to listen to made by people you don't care about.";
	const ogTags = ogMeta({
		title: pageTitle,
		description: pageDescription,
		url: pageUrl,
		type: 'website'
	});
	const webSiteLd = jsonLdWebsite();
	const breadcrumbLd = jsonLdBreadcrumb([{ name: 'Home', href: '/' }]);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<link rel="canonical" href={pageUrl} />
	{#each Object.entries(ogTags) as [property, content] (property)}
		<meta {property} {content} />
	{/each}
</svelte:head>

<JsonLd html={jsonLdScript(webSiteLd)} />
<JsonLd html={jsonLdScript(breadcrumbLd)} />

<h1>Faux Fetus</h1>

<section aria-labelledby="recently-added">
	<h2 id="recently-added">Recently added</h2>
	<p>Everything to land in the catalog since the site's reconception, newest first:</p>
	{#if data.recentGroups.length > 0}
		<ol>
			{#each data.recentGroups as group (group.slug)}
				<li>
					<a href={resolve(`/news/${group.slug}`)}>
						<time datetime={group.date}>{formatDateLong(group.date)}</time>
					</a>
					<ul>
						{#each group.items as item (item.artistSlug + (item.albumSlug ?? ''))}
							<li>
								<a href={resolve(`/artists/${item.artistSlug}`)}>{item.artistName}</a>
								{#if item.albumSlug}
									,
									<a href={resolve(`/artists/${item.artistSlug}/${item.albumSlug}`)}>
										{item.albumName}
									</a>
								{:else}
									<small>New artist</small>
								{/if}
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ol>
	{:else}
		<p>Nothing new announced. Check the news for the latest.</p>
	{/if}
	<p>
		<a href={resolve('/news/')}>More context in the news &rarr;</a>
	</p>
</section>

<section aria-labelledby="news-teaser">
	<h2 id="news-teaser">News</h2>
	{#each data.recentPosts as post (post.slug)}
		<article>
			<h3>
				<a href={resolve(`/news/${post.slug}`)}>{post.title}</a>
			</h3>
			<time datetime={post.date}>{formatDateLong(post.date)}</time>
			<p>{post.excerpt}</p>
		</article>
	{/each}
	<p>
		<a href={resolve('/news/')}>All news &rarr;</a>
	</p>
</section>
