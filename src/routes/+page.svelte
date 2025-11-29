<script lang="ts">
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	const breadcrumbItems = [{ name: 'Home', href: '/' as const }];
</script>

<div class="flex flex-col gap-6">
	<Breadcrumb items={breadcrumbItems} />
	<h1 class="text-2xl">What have we done</h1>
</div>
