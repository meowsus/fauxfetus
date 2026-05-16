<script lang="ts">
	import { getPlayerContext } from '$lib/context/player';

	const playerStore = getPlayerContext();
	const { position, duration } = $derived($playerStore);

	let progress = $derived(duration > 0 ? (position / duration) * 100 : 0);
</script>

<progress class="progress w-56 progress-accent" value={progress} max="100"></progress>
