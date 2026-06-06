<script lang="ts">
	import { cn } from '$lib/helpers/tailwind';
	import TrackRow from './TrackRow.svelte';

	interface Track {
		slug: string;
		name: string;
		artistSlug: string;
		artistName: string;
		albumSlug: string;
		albumName: string;
		isCompilation: boolean;
		audioUrl: string;
		number: number | null;
	}

	interface Props {
		tracks: Track[];
		className?: string;
		shouldUseIndexAsTrackNumber?: boolean;
		shouldTogglePlayerDrawer?: boolean;
		shouldDisableRadioMode?: boolean;
		shouldHideArtist?: boolean;
	}

	let {
		tracks,
		className,
		shouldUseIndexAsTrackNumber = false,
		shouldTogglePlayerDrawer = true,
		shouldDisableRadioMode = false,
		shouldHideArtist = false
	}: Props = $props();
</script>

<ul class={cn('list rounded-box bg-base-100 shadow-md', className)}>
	<li class="p-4 pb-2 text-xs tracking-wide opacity-60">Tracks</li>

	{#each tracks as track, index (track.audioUrl)}
		<TrackRow
			{track}
			{index}
			playlist={tracks}
			{shouldUseIndexAsTrackNumber}
			{shouldTogglePlayerDrawer}
			{shouldDisableRadioMode}
			{shouldHideArtist}
		/>
	{/each}
</ul>
