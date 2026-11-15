<script lang="ts">
	let { position = 0, duration = 0 }: { position: number; duration: number } = $props();

	let progress = $derived(duration > 0 ? (position / duration) * 100 : 0);
</script>

<progress value={progress} max="100" aria-label="Playback position"></progress>
