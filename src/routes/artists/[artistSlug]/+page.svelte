<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import ArtistAlbumList from '$lib/components/ArtistAlbumList.svelte';

	let { data }: { data: PageData } = $props();

	const artistPath = `/artists/${data.artist.artistName.toLowerCase().replace(/\s+/g, '-')}`;
	const breadcrumbItems = [
		{ name: 'Home', href: '/' },
		{ name: 'Artists', href: '/artists' },
		{ name: data.artist.artistName, href: artistPath }
	];
</script>

<div class="flex flex-col gap-2">
	<Breadcrumb items={breadcrumbItems} />
	<ArtistAlbumList albums={data.artist.albums} />
</div>
