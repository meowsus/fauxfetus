<script lang="ts">
	import { getPlayerContext } from '$lib/context/player';

	interface Props {
		audioElement: HTMLAudioElement | null;
	}

	let { audioElement }: Props = $props();

	let progress = $state(0);

	const playerStore = getPlayerContext();
	const { currentTrackIndex } = $derived($playerStore);

	// Poll current time from audio element
	$effect(() => {
		if (!audioElement) return;

		const updateProgress = () => {
			const { currentTime, duration } = audioElement!;
			const value = Number.isFinite(duration) && duration > 0 ? (currentTime / duration) * 100 : 0;
			progress = value;
		};

		updateProgress();

		const id = setInterval(updateProgress, 500);
		return () => clearInterval(id);
	});

	// Reset progress when track index changes
	$effect(() => {
		currentTrackIndex;
		progress = 0;
	});
</script>

<progress class="progress w-56 progress-accent" value={progress} max="100"></progress>
