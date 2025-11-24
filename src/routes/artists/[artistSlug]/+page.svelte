<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto px-4 py-8">
	<div class="breadcrumbs mb-6 text-sm">
		<ul>
			<li><a href="/artists" class="link link-primary">Artists</a></li>
			<li class="text-base-content">{data.artist.artistName}</li>
		</ul>
	</div>

	<h1 class="mb-8 text-4xl font-bold text-base-content">{data.artist.artistName}</h1>

	<h2 class="mb-4 text-2xl font-semibold text-base-content">Albums</h2>
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
