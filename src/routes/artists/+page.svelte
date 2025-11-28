<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import ArtistList from '$lib/components/ArtistList.svelte';

	let { data }: { data: PageData } = $props();

	const breadcrumbItems = [{ name: 'Home', href: '/' }, { name: 'Artists' }];
</script>

<div class="flex flex-col gap-2">
	<Breadcrumb items={breadcrumbItems} />
	<ArtistList artists={data.artists} />
</div>
