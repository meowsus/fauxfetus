<script lang="ts">
	import { resolve } from '$app/paths';

	import InstallAppButton from './InstallAppButton.svelte';

	/* The address is assembled only at click time so it never ships as a
	 * static `mailto:` string that spambots can scrape (the approach main
	 * used). */
	function handleEmail(): void {
		const u = 'curt';
		const d = 'fauxfetus.net';
		window.location.href = `mailto:${u}@${d}`;
	}
</script>

<footer>
	<nav aria-label="Footer">
		<ul>
			<li><a href="https://github.com/meowsus/fauxfetus">GitHub</a></li>
			<InstallAppButton />
			<li><a href={resolve('sitemap.xml')}>Sitemap</a></li>
			<li><button type="button" onclick={handleEmail}>Email</button></li>
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

	nav a,
	nav button {
		color: var(--dim);
		font-size: 0.7rem;
		font-weight: 500;
		letter-spacing: 0.26em;
		text-transform: uppercase;
		display: inline-block;
		padding: 0.55em 0;
	}

	/* the Email “link” is really a button (address is click-assembled);
	 * app.css's global button reset already strips the UA chrome */

	nav a:hover,
	nav button:hover {
		color: var(--violet);
	}
</style>
