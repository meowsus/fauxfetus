<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	let { data }: { data: PageData } = $props();

	const breadcrumbItems = [{ name: 'Home', href: '/' }, { name: 'Artists' }];
</script>

<Breadcrumb items={breadcrumbItems} />

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
	{#each data.artists as artist (artist.artistPath)}
		<a
			href={artist.artistPath}
			class="card bg-base-100 transition-colors card-border hover:bg-base-200"
		>
			<div class="card-body">
				<h2 class="card-title text-base-content">{artist.artistName}</h2>
			</div>
		</a>
	{/each}
</div>
