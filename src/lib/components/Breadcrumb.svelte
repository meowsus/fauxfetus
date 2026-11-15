<script lang="ts">
	import { resolve } from '$app/paths';

	type ArtistPath = `/artists/${string}`;
	type AlbumPath = `/artists/${string}/${string}`;
	type TrackPath = `/artists/${string}/${string}/${string}`;

	interface BreadcrumbItem {
		name: string;
		href?: '/' | '/artists' | ArtistPath | AlbumPath | TrackPath;
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
