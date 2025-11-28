<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	let { data }: { data: PageData } = $props();

	const breadcrumbItems = [
		{ name: 'Home', href: '/' },
		{ name: 'Artists', href: '/artists' },
		{ name: data.album.artistName, href: data.album.artistPath },
		{ name: data.album.albumName, href: data.album.albumPath }
	];
</script>

<Breadcrumb items={breadcrumbItems} />

<p class="mb-8 text-xl text-base-content/70">by {data.album.artistName}</p>

<div class="mb-6">
	<h2 class="text-xl font-semibold text-base-content/70">Tracks</h2>
</div>
<ul class="list">
	{#each data.album.tracks as track (track.trackPath)}
		<li class="list-row">
			<a
				href={track.trackPath}
				class="card w-full bg-base-100 transition-colors card-border hover:bg-base-200"
			>
				<div class="card-body flex-row items-center gap-4 py-3">
					<span class="badge badge-lg badge-neutral">{track.trackNumber ?? '—'}</span>
					<span class="flex-1 font-medium text-base-content">{track.trackName}</span>
				</div>
			</a>
		</li>
	{/each}
</ul>
