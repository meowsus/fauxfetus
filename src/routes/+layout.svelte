<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/Navbar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />

	<title>Faux Fetus</title>
	<meta
		name="description"
		content="A collection of experimental music you never heard of or even want to listen to made by people you don't care about."
	/>
</svelte:head>

<div class="container mx-auto flex flex-col gap-4 px-4 py-4">
	<Navbar />

	{@render children()}
</div>
