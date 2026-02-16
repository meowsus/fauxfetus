<script lang="ts">
	import { marked } from 'marked';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<article
	class="prose prose-base max-w-none py-8 md:prose-lg dark:prose-invert prose-headings:text-base-content/80 prose-a:text-primary prose-a:underline prose-a:decoration-primary prose-a:underline-offset-2 prose-a:hover:opacity-80"
>
	{#await marked.parse(data.markdown) then html}
		{@html html}
	{/await}
</article>
