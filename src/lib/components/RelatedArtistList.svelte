<script lang="ts">
	import { resolve } from '$app/paths';

	interface Props {
		artists: Array<{ slug: string; name: string; albumCount: number }>;
	}

	let { artists }: Props = $props();
</script>

<ul class="music">
	{#each artists as artist (artist.slug)}
		<li>
			<a href={resolve(`/artists/${artist.slug}`)}>{artist.name}</a>
			<span class="count">
				{artist.albumCount}
				{artist.albumCount === 1 ? 'album' : 'albums'}
			</span>
		</li>
	{/each}
</ul>
