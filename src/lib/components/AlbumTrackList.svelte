<script lang="ts">
	import type { AlbumTrack } from '@fauxfetus/generator';
	import { resolve } from '$app/paths';
	import { cn } from '$lib/helpers/tailwind';

	let { tracks }: { tracks: AlbumTrack[] } = $props();

	let audioElements: HTMLAudioElement[] = $state([]);
	let currentTrackIndex: number | null = $state(null);

	let currentTrackAudio: HTMLAudioElement | null = null;
	let nextTrackAudio: HTMLAudioElement | null = null;

	$effect(() => {
		if (currentTrackIndex === null) return;

		currentTrackAudio = audioElements[currentTrackIndex];

		if (currentTrackIndex < audioElements.length - 1) {
			nextTrackAudio = audioElements[currentTrackIndex + 1];
		} else {
			nextTrackAudio = null;
		}
	});

	function onplay(currentIndex: number) {
		audioElements
			.filter((_, index) => index !== currentIndex)
			.forEach((audioElement) => {
				audioElement.pause();
				audioElement.currentTime = 0;
			});

		currentTrackIndex = currentIndex;
	}

	function onended() {
		if (currentTrackAudio) {
			currentTrackAudio.currentTime = 0;
		}

		if (nextTrackAudio) {
			nextTrackAudio.play();
		}
	}

	function formatTrackNumber(number: number) {
		return number < 10 ? `0${number}` : number;
	}
</script>

<ul class="list rounded-box bg-base-100 shadow-md">
	<li class="p-4 pb-2 text-xs tracking-wide opacity-60">Tracks</li>

	{#each tracks as track, index (track.trackPath)}
		<li class="list-row md:items-center">
			<div
				class={cn(
					'text-4xl font-thin tabular-nums opacity-30',
					currentTrackIndex === index && 'font-bold'
				)}
			>
				{track.trackNumber ? formatTrackNumber(track.trackNumber) : formatTrackNumber(index + 1)}
			</div>
			<div class="list-col-grow">
				<div class="flex flex-col gap-2 md:grid md:grid-cols-[auto_400px] md:items-center">
					<div class="py-1.5 md:py-0">
						<a
							href={resolve(track.trackPath)}
							class="hover:link-primary/80 link text-lg link-primary">{track.trackName}</a
						>
					</div>
					<audio
						controls
						class="w-full"
						bind:this={audioElements[index]}
						onplay={() => onplay(index)}
						{onended}
						preload="none"
					>
						<source src={track.audioUrl} type="audio/mpeg" />
						Your browser does not support the audio element.
					</audio>
				</div>
			</div>
		</li>
	{/each}
</ul>
