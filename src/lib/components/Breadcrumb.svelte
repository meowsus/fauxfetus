<script lang="ts">
	import { resolve } from '$app/paths';
	import type { AlbumPath, ArtistPath, TrackPath } from '@fauxfetus/generator';

	interface BreadcrumbItem {
		name: string;
		href?: '/' | '/artists' | ArtistPath | AlbumPath | TrackPath;
	}

	let { items }: { items: BreadcrumbItem[] } = $props();
</script>

<nav class="breadcrumbs rounded bg-base-100 px-4 py-2" aria-label="Breadcrumb">
	<ul>
		{#each items as item, index (item.name + index)}
			<li>
				{#if item.href && index < items.length - 1}
					<a href={resolve(item.href)} class="hover:link-primary/80 link font-medium link-primary">
						{item.name}
					</a>
				{:else}
					<span class="font-medium text-base-content/70">{item.name}</span>
				{/if}
			</li>
		{/each}
	</ul>
</nav>
