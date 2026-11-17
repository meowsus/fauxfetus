<script lang="ts">
	import { resolve } from '$app/paths';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import { formatDateShort } from '$lib/helpers/format-date';
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

	const formatCount = (value: number): string => value.toLocaleString('en-US');
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

<div class="hero">
	<h1><em>faux</em>fetus</h1>
	<p class="eyebrow">an experimental music collective</p>
	<div class="tagcol">
		<p class="tagline">{pageDescription}</p>
		<p class="counts">
			<b>{formatCount(data.artistCount)}</b> artists ·
			<b>{formatCount(data.albumCount)}</b> albums ·
			<b>{formatCount(data.trackCount)}</b> tracks
		</p>
	</div>
</div>

<section aria-labelledby="recently-added">
	<h2 id="recently-added" class="lbl">Recently added</h2>
	<p class="note">Everything to land in the catalog since the site's reconception, newest first.</p>
	{#if data.recentGroups.length > 0}
		<ol class="groups">
			{#each data.recentGroups as group (group.slug)}
				<li>
					<p class="group-date">
						<a class="cap" href={resolve(`/news/${group.slug}`)}>
							<time datetime={group.date}>{formatDateShort(group.date)}</time>
						</a>
					</p>
					<ul class="items">
						{#each group.items as item (item.artistSlug + (item.albumSlug ?? ''))}
							<li>
								<a href={resolve(`/artists/${item.artistSlug}`)}>{item.artistName}</a>
								{#if item.albumSlug}
									<span class="albs">
										—
										<a href={resolve(`/artists/${item.artistSlug}/${item.albumSlug}`)}>
											{item.albumName}
										</a>
										{#if item.trackCount !== undefined}
											<span class="track-count">
												· {item.trackCount}
												{item.trackCount === 1 ? 'track' : 'tracks'}
											</span>
										{/if}
									</span>
								{:else}
									<small>new artist</small>
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
</section>

<section aria-labelledby="news-teaser" class="news">
	<h2 id="news-teaser" class="news-label">News</h2>
	{#if data.recentPosts.length > 0}
		<ol class="newslist">
			{#each data.recentPosts as post (post.slug)}
				<li>
					<p class="cap dim date">
						<time datetime={post.date}>{formatDateShort(post.date)}</time>
					</p>
					<h3>
						<a href={resolve(`/news/${post.slug}`)}>{post.title}</a>
					</h3>
					<p class="excerpt">{post.excerpt}</p>
				</li>
			{/each}
		</ol>
	{:else}
		<p>No news posts yet.</p>
	{/if}
	<p class="sec-foot">
		<a class="cap dim" href={resolve('/news/')}>all news →</a>
	</p>
</section>
