<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	let { data }: { data: PageData } = $props();

	const breadcrumbItems = [
		{ name: 'Home', href: '/' as const },
		{ name: 'Artists', href: '/artists' as const },
		{ name: data.track.artistName, href: data.track.artistPath },
		{ name: data.track.albumName, href: data.track.albumPath },
		{ name: data.track.trackName }
	];
</script>

<div class="flex flex-col gap-2">
	<Breadcrumb items={breadcrumbItems} />

	<audio controls class="w-full">
		<source src={data.track.audioUrl} type="audio/mpeg" />
		Your browser does not support the audio element.
	</audio>
</div>
