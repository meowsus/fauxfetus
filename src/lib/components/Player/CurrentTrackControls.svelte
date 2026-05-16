<script lang="ts">
	import { cn } from '$lib/helpers/tailwind';
	import { getPlayerContext, getPlayerActions } from '$lib/context/player';

	const playerStore = getPlayerContext();
	const actionsStore = getPlayerActions();
	const actions = $derived($actionsStore);

	const { isPlaying } = $derived($playerStore);
</script>

<button class="btn btn-square btn-ghost" onclick={() => actions.prev()}>
	<span class="icon-[line-md--chevron-small-double-left]">Previous</span>
</button>

<button class="btn btn-square btn-ghost" onclick={() => actions.togglePlay()}>
	<span
		class={cn(
			isPlaying ? 'icon-[line-md--play-filled-to-pause-transition]' : 'icon-[line-md--play-twotone]'
		)}
		>{#if isPlaying}Pause{:else}Play{/if}</span
	>
</button>

<button class="btn btn-square btn-ghost" onclick={() => actions.next()}>
	<span class="icon-[line-md--chevron-small-double-right]">Next</span>
</button>
