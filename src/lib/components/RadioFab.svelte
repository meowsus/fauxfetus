<script lang="ts">
	import { get } from 'svelte/store';

	import { getPlayerContext } from '$lib/context/player';
	import { loadRadioPlaylist, togglePlayerDrawer } from '$lib/helpers/player';
	import { cn } from '$lib/helpers/tailwind';

	const playerStore = getPlayerContext();

	const { isPlaying } = $derived($playerStore);

	function handleClick() {
		togglePlayerDrawer();

		const player = get(playerStore);

		if (player.playlist.length === 0) {
			playerStore.update((s) => ({ ...s, isLoading: true }));
			loadRadioPlaylist(playerStore);
		}
	}
</script>

<button
	class={cn(
		'btn fixed right-6 bottom-6 z-9 btn-circle shadow-lg btn-primary',
		isPlaying && 'animate-pulse-slow'
	)}
	onclick={handleClick}
	title="Toggle radio"
	aria-label="Toggle radio"
>
	<span
		class={cn(
			isPlaying ? 'icon-[line-md--volume-high-twotone]' : 'icon-[line-md--volume-low-twotone]'
		)}>Radio</span
	>
</button>
