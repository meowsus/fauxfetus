<script lang="ts">
	import { resolve } from '$app/paths';

	import InstallAppButton from './InstallAppButton.svelte';
</script>

<nav aria-label="Main">
	<a href={resolve('/')}>fauxfetus</a>
	<ul>
		<li><a href={resolve('/')}>Home</a></li>
		<li><a href={resolve('/artists/')}>Artists</a></li>
		<li><a href="https://github.com/meowsus/fauxfetus">GitHub</a></li>
		<li><a href="mailto:curt@fauxfetus.net">Email</a></li>
		<li><InstallAppButton /></li>
	</ul>
</nav>
