<script lang="ts">
	import '../app.css';

	import Navbar from '$lib/components/Navbar.svelte';
	import Player from '$lib/components/Player/index.svelte';

	import { setPlayerContext, type PlayerState } from '$lib/context/player';
	import { writable } from 'svelte/store';

	const playerStore = writable<PlayerState>({
		isLoading: false,
		isPlaying: false,
		isRadio: false,
		allTracks: [],
		playlist: [],
		currentTrackIndex: null
	});

	setPlayerContext(playerStore);

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/icons/icon-32x32.png" type="image/png" />

	<title>Faux Fetus</title>
	<meta
		name="description"
		content="A collection of experimental music you never heard of or even want to listen to made by people you don't care about."
	/>
</svelte:head>

<div class="drawer drawer-end">
	<input id="player-drawer-toggle" type="checkbox" class="drawer-toggle" />

	<div class="drawer-content">
		<div class="bg-base-300 shadow-sm">
			<div class="container mx-auto">
				<Navbar />
			</div>
		</div>

		<div class="container mx-auto flex flex-col gap-4 px-4 py-4">
			{@render children()}
		</div>
	</div>

	<div class="drawer-side">
		<label for="player-drawer-toggle" aria-label="close sidebar" class="drawer-overlay"></label>
		<div class="min-h-full w-[90vw] bg-base-200 p-4 lg:w-[30vw]">
			<Player />
		</div>
	</div>
</div>
