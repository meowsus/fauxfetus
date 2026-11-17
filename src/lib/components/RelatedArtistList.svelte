<script lang="ts">
	import { resolve } from '$app/paths';

	interface Props {
		artists: Array<{ slug: string; name: string }>;
	}

	let { artists }: Props = $props();
</script>

<!-- Related artists read as a quiet afterthought: comma-separated names in
     the metadata voice, far from the album ledger's serif prominence. -->
<ul class="related">
	{#each artists as artist (artist.slug)}
		<li><a href={resolve(`/artists/${artist.slug}`)}>{artist.name}</a></li>
	{/each}
</ul>

<style>
	ul.related {
		list-style: none;
		padding: 0;
		margin-top: 1.1rem;
		font-size: 0.9rem;
		color: var(--dim);
	}

	ul.related li {
		display: inline;
	}

	ul.related li + li::before {
		content: ', ';
	}
</style>
