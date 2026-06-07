<script lang="ts">
	import { resolve } from '$app/paths';

	let { artists }: { artists: Array<{ slug: string; name: string }> } = $props();
</script>

{#if artists.length > 0}
	<ul class="list rounded-box bg-base-100 shadow-md">
		<li class="p-4 pb-2 text-xs tracking-wide opacity-60">Related Artists</li>

		{#each artists as artist (artist.slug)}
			<li class="list-row">
				<div>
					<a
						href={resolve(`/artists/${artist.slug}`)}
						class="hover:link-secondary/80 link text-lg link-secondary">{artist.name}</a
					>
				</div>
			</li>
		{/each}
	</ul>
{/if}
