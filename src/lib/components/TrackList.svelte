<script lang="ts">
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
		shouldUseIndexAsTrackNumber?: boolean;
		shouldDisableRadioMode?: boolean;
		shouldHideArtist?: boolean;
	}

	let {
		tracks,
		shouldUseIndexAsTrackNumber = false,
		shouldDisableRadioMode = false,
		shouldHideArtist = false
	}: Props = $props();
</script>

<section>
	<h2>Tracks</h2>

	<ol>
		{#each tracks as track, index (track.audioUrl)}
			<TrackRow
				{track}
				{index}
				playlist={tracks}
				{shouldUseIndexAsTrackNumber}
				{shouldDisableRadioMode}
				{shouldHideArtist}
			/>
		{/each}
	</ol>
</section>
