<script lang="ts">
	interface BreadcrumbItem {
		name: string;
		href?: string;
	}

	let { items }: { items: BreadcrumbItem[] } = $props();

	const breadcrumbData = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: item.href || '#'
		}))
	};
</script>

<svelte:head>
	<script type="application/ld+json">
		{JSON.stringify(breadcrumbData)}
	</script>
</svelte:head>

<nav class="breadcrumbs mb-8 rounded-lg bg-base-200 px-4 py-2 text-lg" aria-label="Breadcrumb">
	<ul>
		{#each items as item, index (item.name + index)}
			<li>
				{#if item.href && index < items.length - 1}
					<a href={item.href} class="hover:link-primary/80 link font-medium link-primary">
						{item.name}
					</a>
				{:else}
					<span class="font-medium text-base-content/70">{item.name}</span>
				{/if}
			</li>
		{/each}
	</ul>
</nav>
