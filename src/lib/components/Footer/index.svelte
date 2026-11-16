<script lang="ts">
	import { asset } from '$app/paths';

	import InstallAppButton from './InstallAppButton.svelte';
</script>

<footer>
	<nav aria-label="Footer">
		<ul>
			<li><a href="https://github.com/meowsus/fauxfetus">GitHub</a></li>
			<li><InstallAppButton /></li>
			<li><a href={asset('/sitemap.xml')}>Sitemap</a></li>
			<li><a href="mailto:curt@fauxfetus.net">Email</a></li>
		</ul>
	</nav>
</footer>

<style>
	/* footer — minimal centered row of descriptive caps links; 0.55em
	 * vertical padding makes them honest touch targets */
	footer {
		margin-top: 6rem;
		border-top: 1px solid var(--hair);
		padding-top: 1.6rem;
	}

	nav ul {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.3rem 1.4rem;
		padding: 0;
	}

	nav a {
		color: var(--dim);
		font-size: 0.7rem;
		font-weight: 500;
		letter-spacing: 0.26em;
		text-transform: uppercase;
		display: inline-block;
		padding: 0.55em 0;
	}

	nav a:hover {
		color: var(--violet);
	}
</style>
