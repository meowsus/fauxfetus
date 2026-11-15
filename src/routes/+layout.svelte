<script lang="ts">
	import '../app.css';

	import Navbar from '$lib/components/Navbar/index.svelte';
	import Player from '$lib/components/Player/index.svelte';
	import RadioFab from '$lib/components/RadioFab.svelte';
	import UpdateNotification from '$lib/components/UpdateNotification.svelte';

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
		currentTrackIndex: null
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

<header>
	<Navbar />
</header>

<main>
	{@render children()}
</main>

<aside aria-label="Player">
	<Player />
	<RadioFab />
</aside>

<UpdateNotification />
