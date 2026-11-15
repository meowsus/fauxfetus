<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { getPlayerActions, getPlayerContext } from '$lib/context/player';
	import Search from '$lib/components/Search.svelte';
	import { startRadio } from '$lib/helpers';

	const playerStore = getPlayerContext();
	const playerActionsStore = getPlayerActions();

	function handleRadioStart(): void {
		startRadio(playerStore, $playerActionsStore);
	}
</script>

<nav aria-label="Main">
	<a href={resolve('/')}>fauxfetus</a>
	<ul>
		<li><a href={resolve('/')}>Home</a></li>
		<li><a href={resolve('/artists/')}>Artists ({page.data.artistCount})</a></li>
		<li><a href={resolve('/albums/')}>Albums ({page.data.albumCount})</a></li>
		<li><a href={resolve('/news/')}>News</a></li>
		<li><button type="button" onclick={handleRadioStart}>Radio</button></li>
		<li><a href="mailto:curt@fauxfetus.net">Email</a></li>
	</ul>
</nav>

<Search />
