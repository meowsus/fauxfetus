<script lang="ts">
	import { resolve } from '$app/paths';
	import { avatarColorClass, clickableCardClass, initialsFromName } from '$lib/helpers/avatar';

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

<div class="rounded-box bg-base-100 shadow-md">
	<div class="p-4 pb-2 text-xs tracking-wide opacity-60">Albums</div>

	<div class="p-4 pt-2">
		<div class="flex flex-col gap-2">
			{#each albums as album (album.slug)}
				<a href={resolve(`/artists/${album.artistSlug}/${album.slug}`)} class={clickableCardClass}>
					<div class="card-body flex-row items-center gap-3 p-4">
						<div class="avatar avatar-placeholder shrink-0">
							<div class="{avatarColorClass(album.slug)} w-12 rounded-full">
								<span class="text-sm">{initialsFromName(album.name)}</span>
							</div>
						</div>

						<div class="line-clamp-2 grow text-sm font-medium">
							{album.name}
						</div>

						{#if album.isCompilation}
							<div class="flex shrink-0 justify-end">
								<span class="badge badge-outline badge-sm badge-info">Compilation</span>
							</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	</div>
</div>
