<script lang="ts">
	import { resolve } from '$app/paths';

	type ArtistPath = `artists/${string}`;
	type AlbumPath = `artists/${string}/${string}`;
	type TrackPath = `artists/${string}/${string}/${string}`;
	type NewsPath = '/news' | `news/${string}`;

	/** href is consumed by resolve() from '$app/paths', never rendered raw:
	 * route-id form for fixed crumbs ('/', '/artists', '/news') and pathname
	 * form (no leading slash, kit 3 Path type) for dynamic ones. */
	interface BreadcrumbItem {
		name: string;
		href?: '/' | '/artists' | ArtistPath | AlbumPath | TrackPath | NewsPath;
	}

	let { items }: { items: BreadcrumbItem[] } = $props();
</script>

<nav aria-label="Breadcrumb">
	<ul>
		{#each items as item, index (item.name + index)}
			<li>
				{#if item.href && index < items.length - 1}
					<a href={resolve(item.href)}>{item.name}</a>
				{:else if index === items.length - 1}
					<span aria-current="page">{item.name}</span>
				{:else}
					<span>{item.name}</span>
				{/if}
			</li>
		{/each}
	</ul>
</nav>
