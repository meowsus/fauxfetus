<script lang="ts">
	import type { Artist } from '@fauxfetus/generator';
	import { resolve } from '$app/paths';

	let { artists }: { artists: Artist[] } = $props();
</script>

<ul class="list rounded-box bg-base-100 shadow-md">
	<li class="p-4 pb-2 text-xs tracking-wide opacity-60">Artist catalog</li>

	{#each artists as artist (artist.artistPath)}
		<li class="list-row">
			<div>
				<!-- <img
					class="size-10 rounded-box"
					alt="{artist.artistName} image"
				/> -->
			</div>
			<div>
				<a href={resolve(artist.artistPath)} class="hover:link-primary/80 link link-primary"
					>{artist.artistName}</a
				>
				<!-- <div class="text-xs font-semibold uppercase opacity-60">Remaining Reason</div> -->
			</div>
			<!-- <button class="btn btn-square btn-ghost">
				<svg class="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
					><g
						stroke-linejoin="round"
						stroke-linecap="round"
						stroke-width="2"
						fill="none"
						stroke="currentColor"><path d="M6 3L20 12 6 21 6 3z"></path></g
					></svg
				>
			</button>
			<button class="btn btn-square btn-ghost">
				<svg class="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
					><g
						stroke-linejoin="round"
						stroke-linecap="round"
						stroke-width="2"
						fill="none"
						stroke="currentColor"
						><path
							d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
						></path></g
					></svg
				>
			</button> -->
		</li>
	{/each}
</ul>
