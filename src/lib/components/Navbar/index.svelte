<script lang="ts">
	import { get } from 'svelte/store';
	import { resolve } from '$app/paths';

	import InstallAppButton from './InstallAppButton.svelte';
	import { getPlayerContext } from '$lib/context/player';
	import { loadRadioPlaylist } from '$lib/helpers/player';
	import { cn } from '$lib/helpers/tailwind';

	const playerStore = getPlayerContext();

	const { isPlaying } = $derived($playerStore);

	function handlePlayerClick() {
		document.getElementById('player-drawer-toggle')?.click();

		const player = get(playerStore);

		if (player.playlist.length === 0) {
			playerStore.update((s) => ({ ...s, isLoading: true }));
			loadRadioPlaylist(playerStore);
		}
	}
</script>

<div class="navbar bg-base-100 shadow-sm">
	<div class="navbar-start">
		<div class="dropdown">
			<div tabindex="0" role="button" class="btn btn-circle btn-ghost">
				<span class="icon-[line-md--menu]">Menu</span>
			</div>
			<ul
				tabindex="-1"
				class="dropdown-content menu z-1 mt-3 w-52 menu-lg rounded-box bg-base-200 p-2 shadow"
			>
				<li><a href={resolve('/')}>Home</a></li>
				<li><a href={resolve('/artists')}>Artists</a></li>
				<li><a href="https://github.com/meowsus/fauxfetus/issues/new/choose">Contact</a></li>
			</ul>
		</div>
	</div>
	<div class="navbar-center">
		<a href={resolve('/')} class="px-4 font-mono text-2xl">fauxfetus</a>
	</div>
	<div class="navbar-end">
		<div class="flex items-center gap-2">
			<InstallAppButton />

			<button
				class="drawer-button btn btn-circle btn-ghost"
				onclick={handlePlayerClick}
				title="Toggle radio"
			>
				<span
					class={cn(
						isPlaying
							? 'icon-[line-md--volume-high-twotone] text-accent'
							: 'icon-[line-md--volume-low-twotone] text-secondary'
					)}>Radio</span
				>
			</button>
		</div>
	</div>
</div>
