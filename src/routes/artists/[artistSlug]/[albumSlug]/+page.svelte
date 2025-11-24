<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto px-4 py-8">
	<div class="breadcrumbs mb-6 text-sm">
		<ul>
			<li><a href="/artists" class="link link-primary">Artists</a></li>
			<li><a href={data.album.artistPath} class="link link-primary">{data.album.artistName}</a></li>
			<li class="text-base-content">{data.album.albumName}</li>
		</ul>
	</div>

	<h1 class="mb-2 text-4xl font-bold text-base-content">{data.album.albumName}</h1>
	<p class="mb-8 text-xl text-base-content/70">by {data.album.artistName}</p>

	<h2 class="mb-4 text-2xl font-semibold text-base-content">Tracks</h2>
	<ul class="list">
		{#each data.album.tracks as track (track.trackPath)}
			<li class="list-row">
				<a
					href={track.trackPath}
					class="card card-border bg-base-100 hover:bg-base-200 transition-colors w-full"
				>
					<div class="card-body flex-row items-center gap-4 py-3">
						<span class="badge badge-neutral badge-lg">{track.trackNumber ?? '—'}</span>
						<span class="flex-1 font-medium text-base-content">{track.trackName}</span>
					</div>
				</a>
			</li>
		{/each}
	</ul>
</div>

