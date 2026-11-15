<script lang="ts">
	import { getPlayerContext, getPlayerActions } from '$lib/context/player';

	const playerStore = getPlayerContext();
	const actionsStore = getPlayerActions();
	const actions = $derived($actionsStore);

	const { isPlaying } = $derived($playerStore);
</script>

<button type="button" onclick={() => actions.prev()}>Previous</button>

<button type="button" onclick={() => actions.togglePlay()}>{isPlaying ? 'Pause' : 'Play'}</button>

<button type="button" onclick={() => actions.next()}>Next</button>
