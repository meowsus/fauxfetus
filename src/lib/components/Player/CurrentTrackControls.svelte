<script lang="ts">
	import { cn } from '$lib/helpers/tailwind';
	import { getPlayerContext } from '$lib/context/player';
	import { updateMediaSessionPlaybackState } from '$lib/helpers/media-session';

	import { incrementCurrentTrackIndex, decrementCurrentTrackIndex } from '$lib/helpers/player';

	interface Props {
		audioElement: HTMLAudioElement | null;
	}

	let { audioElement }: Props = $props();

	const playerStore = getPlayerContext();
	const { isPlaying } = $derived($playerStore);

	function handlePrevious() {
		decrementCurrentTrackIndex(playerStore);
	}

	function handleNext() {
		incrementCurrentTrackIndex(playerStore);
	}

	function handlePlay() {
		if (isPlaying) {
			audioElement?.pause();
			playerStore.update((s) => ({ ...s, isPlaying: false }));
			updateMediaSessionPlaybackState(false);
		} else {
			audioElement?.play()?.catch(() => {});
			playerStore.update((s) => ({ ...s, isPlaying: true }));
			updateMediaSessionPlaybackState(true);
		}
	}
</script>

<button class="btn btn-square btn-ghost" onclick={handlePrevious}>
	<span class="icon-[line-md--chevron-small-double-left]">Previous</span>
</button>

<button class="btn btn-square btn-ghost" onclick={handlePlay}>
	<span
		class={cn(
			isPlaying ? 'icon-[line-md--play-filled-to-pause-transition]' : 'icon-[line-md--play-twotone]'
		)}
		>{#if isPlaying}Pause{:else}Play{/if}</span
	>
</button>

<button class="btn btn-square btn-ghost" onclick={handleNext}>
	<span class="icon-[line-md--chevron-small-double-right]">Next</span>
</button>
