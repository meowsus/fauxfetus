<script lang="ts">
	import { resolve } from '$app/paths';

	let { artists }: { artists: Array<{ slug: string; name: string }> } = $props();
</script>

{#if artists.length > 0}
	<section>
		<h2>Related Artists</h2>

		<p>
			{#each artists as artist, i (artist.slug)}
				<a href={resolve(`/artists/${artist.slug}`)}>{artist.name}</a
				>{#if i < artists.length - 1}{i === artists.length - 2 ? ' & ' : ', '}{/if}
			{/each}
		</p>
	</section>
{/if}
