<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import ArtistList from '$lib/components/ArtistList.svelte';

	let { data }: { data: PageData } = $props();

	const breadcrumbItems = [{ name: 'Home', href: '/' as const }, { name: 'Artists' }];
</script>

<svelte:head>
	<title>Artists - Faux Fetus</title>
	<meta
		name="description"
		content="Browse the collection of experimental music artists on Faux Fetus."
	/>
</svelte:head>

<div class="flex flex-col gap-2">
	<Breadcrumb items={breadcrumbItems} />
	<ArtistList artists={data.artists} />
</div>
