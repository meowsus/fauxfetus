<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="mb-8 text-4xl font-bold">Artists</h1>
	<ul class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each data.artists as artist}
			<li>
				<a
					href={artist.artistPath}
					class="block rounded-lg border border-gray-300 p-4 transition-colors hover:border-gray-400 hover:bg-gray-50"
				>
					<h2 class="text-xl font-semibold">{artist.artistName}</h2>
				</a>
			</li>
		{/each}
	</ul>
</div>
