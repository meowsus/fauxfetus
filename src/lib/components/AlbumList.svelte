<script lang="ts">
	import { resolve } from '$app/paths';

	let {
		albums
	}: {
		albums: Array<{
			slug: string;
			name: string;
			artistSlug: string;
			isCompilation: boolean;
		}>;
	} = $props();
</script>

<section>
	<h2>Albums</h2>

	<ul>
		{#each albums as album (album.slug)}
			<li>
				<a href={resolve(`/artists/${album.artistSlug}/${album.slug}`)}>
					{album.name}
					{#if album.isCompilation}
						<small>Compilation</small>
					{/if}
				</a>
			</li>
		{/each}
	</ul>
</section>
