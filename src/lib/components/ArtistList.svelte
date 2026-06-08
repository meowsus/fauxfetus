<script lang="ts">
	import { resolve } from '$app/paths';
	import { avatarColorClass, clickableCardClass, initialsFromName } from '$lib/helpers/avatar';

	let { artists }: { artists: Array<{ slug: string; name: string }> } = $props();

	let searchValue = $state('');

	let filteredArtists = $derived.by(() => {
		return artists.filter((artist) =>
			artist.name.toLowerCase().includes(searchValue.toLowerCase())
		);
	});
</script>

<div class="rounded-box bg-base-100 shadow-md">
	<div class="flex flex-col gap-2 p-4 pb-2 md:flex-row md:items-center">
		<div class="text-xs tracking-wide opacity-60 md:grow">Artists</div>

		<input
			type="text"
			placeholder="Filter artists..."
			class="input-bordered input w-full md:max-w-64"
			bind:value={searchValue}
		/>
	</div>

	<div class="p-4 pt-2">
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
			{#each filteredArtists as artist (artist.slug)}
				<a href={resolve(`/artists/${artist.slug}`)} class={clickableCardClass}>
					<div class="card-body items-center gap-2 p-4">
						<div class="avatar avatar-placeholder">
							<div class="{avatarColorClass(artist.slug)} w-16 rounded-full">
								<span class="text-xl">{initialsFromName(artist.name)}</span>
							</div>
						</div>

						<div class="line-clamp-2 text-center text-sm font-medium">
							{artist.name}
						</div>
					</div>
				</a>
			{/each}
		</div>
	</div>
</div>
