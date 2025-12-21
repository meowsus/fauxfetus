<script lang="ts">
	import Timeline from '$lib/components/Timeline.svelte';

	const timelineEntries = [
		{
			date: 'Dec 14, 2025',
			description: "I added basic SEO. Pretty boring, tbh. It'll get good soon."
		},
		{
			date: 'Nov 30, 2025',
			description: "I've relaunched the site. Don't ask me why."
		}
	];
</script>

<div class="flex flex-col gap-6 px-6 py-2">
	<section class="flex flex-col gap-4 text-lg">
		<Timeline entries={timelineEntries} />
	</section>
</div>
