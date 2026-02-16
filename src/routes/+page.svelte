<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<article
	class="prose prose-base max-w-none py-8 md:prose-lg dark:prose-invert prose-headings:text-base-content/80 prose-a:text-primary prose-a:underline prose-a:decoration-primary prose-a:underline-offset-2 prose-a:hover:opacity-80"
>
	<!-- Server-rendered HTML from trusted markdown -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html data.html}
</article>
