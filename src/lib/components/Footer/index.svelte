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
