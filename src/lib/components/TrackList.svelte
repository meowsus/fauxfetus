<script lang="ts">
	import { resolve } from '$app/paths';
	import { getPlayerContext } from '$lib/context/player';
	import { togglePlayerDrawer } from '$lib/helpers/player';
	import { cn } from '$lib/helpers/tailwind';
	import type { Track } from '@fauxfetus/generator';

	interface Props {
		tracks: Track[];
		className?: string;
		shouldTogglePlayerDrawer?: boolean;
		shouldUseIndexAsTrackNumber?: boolean;
		shouldDisableRadioMode?: boolean;
		shouldHideArtist?: boolean;
	}

	let {
		tracks,
		className,
		shouldTogglePlayerDrawer = true,
		shouldUseIndexAsTrackNumber = false,
		shouldDisableRadioMode = false,
		shouldHideArtist = false
	}: Props = $props();

	const playerStore = getPlayerContext();

	const currentTrack = $derived.by(() => {
		const { currentTrackIndex, playlist } = $playerStore;
		return currentTrackIndex != null ? playlist[currentTrackIndex] : null;
	});

	function formatTrackNumber(number: number) {
		return number < 10 ? `0${number}` : number;
	}

	function handlePlayButtonClick(index: number) {
		playerStore.update((state) => ({
			...state,
			isPlaying: true,
			playlist: tracks,
			currentTrackIndex: index
		}));

		if (shouldTogglePlayerDrawer) togglePlayerDrawer();
		if (shouldDisableRadioMode) playerStore.update((state) => ({ ...state, isRadio: false }));
	}
</script>

<ul class={cn('list rounded-box bg-base-100 shadow-md', className)}>
	<li class="p-4 pb-2 text-xs tracking-wide opacity-60">Tracks</li>

	{#each tracks as track, index (track.audioUrl)}
		<li
			class={cn(
				'list-row md:items-center',
				currentTrack?.audioUrl === track.audioUrl && 'bg-gray-700'
			)}
		>
			<div class={cn('text-4xl font-thin tabular-nums opacity-30')}>
				{shouldUseIndexAsTrackNumber
					? formatTrackNumber(index + 1)
					: track.number
						? formatTrackNumber(track.number)
						: formatTrackNumber(index + 1)}
			</div>

			<div class="list-col-grow">
				<div class="flex items-center gap-2">
					<div class="flex grow flex-wrap items-center gap-2 py-1.5 md:py-0">
						{#if track.isCompilation && !shouldHideArtist}
							<span class="text-lg"
								><a
									href={resolve(`/artists/${track.artistSlug}`)}
									class="hover:link-secondary/80 link text-lg link-secondary">{track.artistName}</a
								></span
							>

							//
						{/if}

						<a
							href={resolve(`/artists/${track.artistSlug}/${track.albumSlug}/${track.slug}`)}
							class="hover:link-primary/80 link text-lg link-primary">{track.name}</a
						>
					</div>

					<button onclick={() => handlePlayButtonClick(index)} class="btn btn-square btn-ghost">
						<span class="icon-[line-md--play-twotone]">Play</span>
					</button>
				</div>
			</div>
		</li>
	{/each}
</ul>
