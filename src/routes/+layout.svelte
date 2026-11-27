<script lang="ts">
	import '../app.css';
	import Navbar from '#lib/components/Navbar/index.svelte';
	import UpdateNotification from '#lib/components/UpdateNotification.svelte';
	import Footer from '#lib/components/Footer/index.svelte';
	import Player from '#lib/components/Player/index.svelte';

	import {
		setPlayerContext,
		setPlayerActions,
		type PlayerState,
		defaultPlayerActions
	} from '#lib/context/player.js';
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
	<link rel="icon" href="/icons/favicon.svg" type="image/svg+xml" />
	<link rel="icon" href="/icons/icon-32x32.png" type="image/png" sizes="32x32" />

	<title>Faux Fetus</title>
	<meta
		name="description"
		content="A collection of experimental music you never heard of or even want to listen to made by people you don't care about."
	/>
	<meta property="og:site_name" content="Faux Fetus" />
</svelte:head>

<a class="skip-link" href="#main">Skip to content</a>

<Navbar />

<main id="main" tabindex="-1">
	{@render children()}
</main>

<Footer />

<!-- Global player engine + pill: renders nothing until a track plays;
	owns the Gapless5 instance and replaces the layout's no-op actions -->
<Player />

<UpdateNotification />
