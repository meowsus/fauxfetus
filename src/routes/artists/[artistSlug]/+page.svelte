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

<Breadcrumb items={breadcrumbItems} />

<div class="mb-6">
	<h2 class="mb-4 text-xl font-semibold text-base-content/70">Albums</h2>
</div>
<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
	{#each data.artist.albums as album (album.albumPath)}
		<a
			href={album.albumPath}
			class="card bg-base-100 transition-colors card-border hover:bg-base-200"
		>
			<div class="card-body">
				<h3 class="card-title text-base-content">{album.albumName}</h3>
			</div>
		</a>
	{/each}
</div>
