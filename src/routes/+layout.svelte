<script lang="ts">
	import '../app.css';

	import Navbar from '$lib/components/Navbar/index.svelte';
	import Player from '$lib/components/Player/index.svelte';
	import RadioFab from '$lib/components/RadioFab.svelte';

	import {
		setPlayerContext,
		setPlayerActions,
		type PlayerState,
		defaultPlayerActions
	} from '$lib/context/player';
	import { writable } from 'svelte/store';

	const playerStore = writable<PlayerState>({
		isLoading: false,
		isPlaying: false,
		isRadio: false,
		allTracks: [],
		playlist: [],
		currentTrackIndex: null,
		position: 0,
		duration: 0
	});

	const playerActionsStore = writable(defaultPlayerActions);

	setPlayerContext(playerStore);
	setPlayerActions(playerActionsStore);

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/icons/icon-32x32.png" type="image/png" />

	<title>Faux Fetus</title>
	<meta
		name="description"
		content="A collection of experimental music you never heard of or even want to listen to made by people you don't care about."
	/>
	<meta property="og:site_name" content="Faux Fetus" />
</svelte:head>

<div class="drawer drawer-end">
	<input id="player-drawer-toggle" type="checkbox" class="drawer-toggle" />

	<div class="drawer-content">
		<Navbar />

		<div class="container mx-auto flex flex-col gap-4 px-4 py-4 pb-20">
			{@render children()}
		</div>
	</div>

	<RadioFab />

	<div class="drawer-side">
		<label for="player-drawer-toggle" aria-label="close sidebar" class="drawer-overlay"></label>
		<div class="min-h-full w-[90vw] bg-base-200 p-4 lg:w-[30vw]">
			<label
				for="player-drawer-toggle"
				class="btn absolute top-4 right-4 z-10 btn-circle btn-ghost"
				aria-label="Close player"
				title="Close player"
			>
				<span class="icon-[line-md--close-circle-twotone]">Close</span>
			</label>

			<Player />
		</div>
	</div>
</div>
