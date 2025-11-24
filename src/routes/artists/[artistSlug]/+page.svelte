<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	let { data }: { data: PageData } = $props();

	const artistPath = `/artists/${data.artist.artistName.toLowerCase().replace(/\s+/g, '-')}`;
	const breadcrumbItems = [
		{ name: 'Home', href: '/' },
		{ name: 'Artists', href: '/artists' },
		{ name: data.artist.artistName, href: artistPath }
	];
</script>

<div class="container mx-auto px-4 py-8">
	<Breadcrumb items={breadcrumbItems} />

	<div class="mb-6">
		<h2 class="text-xl font-semibold text-base-content/70 mb-4">Albums</h2>
	</div>
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.artist.albums as album (album.albumPath)}
			<a href={album.albumPath} class="card card-border bg-base-100 hover:bg-base-200 transition-colors">
				<div class="card-body">
					<h3 class="card-title text-base-content">{album.albumName}</h3>
				</div>
			</a>
		{/each}
	</div>
</div>
