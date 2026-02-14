<script>
	import { get } from 'svelte/store';
	import { resolve } from '$app/paths';

	import { getPlayerContext } from '$lib/context/player';
	import { loadRadioPlaylist } from '$lib/helpers/player';

	const playerStore = getPlayerContext();

	function handlePlayerClick() {
		document.getElementById('player-drawer-toggle')?.click();

		const player = get(playerStore);

		if (player.playlist.length === 0) {
			playerStore.update((s) => ({ ...s, isLoading: true }));
			loadRadioPlaylist(playerStore);
		}
	}
</script>

<div class="navbar rounded-lg bg-base-300 shadow-sm">
	<div class="navbar-start">
		<div class="dropdown">
			<div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
				<span class="icon-[line-md--menu]">Menu</span>
			</div>
			<ul tabindex="-1" class="dropdown-content menu z-1 mt-3 w-52 menu-lg bg-base-300 p-2 shadow">
				<li><a href={resolve('/artists')}>Artists</a></li>
				<li>
					<button class="drawer-button" onclick={handlePlayerClick}>Player</button>
				</li>
			</ul>
		</div>
		<a href={resolve('/')} class="px-4 font-mono text-2xl">fauxfetus</a>
	</div>
	<div class="navbar-end hidden pr-4 lg:flex">
		<ul class="menu menu-horizontal px-1">
			<li><a href={resolve('/artists')}>Artists</a></li>
			<li>
				<button class="drawer-button" onclick={handlePlayerClick}>Player</button>
			</li>
		</ul>
	</div>
</div>
