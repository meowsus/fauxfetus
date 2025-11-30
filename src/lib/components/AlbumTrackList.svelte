<script lang="ts">
	import type { AlbumTrack } from '@fauxfetus/generator';
	import { resolve } from '$app/paths';

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
				audioElement.currentTime = 0;
				audioElement.pause();
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
</script>

<ul class="list rounded-box bg-base-100 shadow-md">
	<li class="p-4 pb-2 text-xs tracking-wide opacity-60">Track catalog</li>

	{#each tracks as track, index (track.trackPath)}
		<li class="list-row">
			<div class="text-4xl font-thin tabular-nums opacity-30">
				{track.trackNumber
					? track.trackNumber < 10
						? `0${track.trackNumber}`
						: track.trackNumber
					: '-'}
			</div>
			<div>
				<!-- <img
					class="size-10 rounded-box"
					alt="{artist.artistName} image"
				/> -->
			</div>
			<div class="list-col-grow">
				<div class="flex flex-col gap-2">
					<a href={resolve(track.trackPath)} class="hover:link-primary/80 link link-primary"
						>{track.trackName}</a
					>
					<audio
						controls
						class="w-full"
						bind:this={audioElements[index]}
						onplay={() => onplay(index)}
						{onended}
					>
						<source src={track.audioUrl} type="audio/mpeg" />
						Your browser does not support the audio element.
					</audio>
				</div>
				<!-- <div class="text-xs font-semibold uppercase opacity-60">by {artistName}</div> -->
			</div>
			<!-- <button class="btn btn-square btn-ghost">
				<svg class="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
					><g
						stroke-linejoin="round"
						stroke-linecap="round"
						stroke-width="2"
						fill="none"
						stroke="currentColor"><path d="M6 3L20 12 6 21 6 3z"></path></g
					></svg
				>
			</button>
			<button class="btn btn-square btn-ghost">
				<svg class="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
					><g
						stroke-linejoin="round"
						stroke-linecap="round"
						stroke-width="2"
						fill="none"
						stroke="currentColor"
						><path
							d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
						></path></g
					></svg
				>
			</button> -->
		</li>
	{/each}
</ul>
