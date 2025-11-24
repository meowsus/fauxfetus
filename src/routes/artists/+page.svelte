<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="mb-8 text-4xl font-bold text-base-content">Artists</h1>
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
</div>
