<script lang="ts">
	import { resolve } from '$app/paths';

	let { artists }: { artists: Array<{ slug: string; name: string }> } = $props();
</script>

{#if artists.length > 0}
	<div class="rounded-box bg-base-100 shadow-md">
		<div class="p-4 pb-2 text-xs tracking-wide opacity-60">Related Artists</div>

		<p class="p-4 pt-2 text-base">
			{#each artists as artist, i (artist.slug)}
				<a
					href={resolve(`/artists/${artist.slug}`)}
					class="hover:link-secondary/80 link link-secondary">{artist.name}</a
				>{#if i < artists.length - 1}{i === artists.length - 2 ? ' & ' : ', '}{/if}
			{/each}
		</p>
	</div>
{/if}
