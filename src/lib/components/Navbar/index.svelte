<script lang="ts">
	import { resolve } from '$app/paths';

	import InstallAppButton from './InstallAppButton.svelte';
</script>

<div class="navbar overflow-x-hidden bg-base-100 shadow-sm">
	<div class="navbar-start">
		<a href={resolve('/')} class="px-4 font-mono text-2xl">fauxfetus</a>
	</div>
	<div class="navbar-end">
		<div class="flex items-center gap-1">
			<a href={resolve('/')} class="btn btn-circle btn-ghost" aria-label="Home" title="Home">
				<span class="icon-[line-md--home-md-twotone]">Home</span>
			</a>
			<a
				href={resolve('/artists/')}
				class="btn btn-circle btn-ghost"
				aria-label="Artists"
				title="Artists"
			>
				<span class="icon-[line-md--compass-twotone]">Artists</span>
			</a>
			<a
				href="https://github.com/meowsus/fauxfetus"
				class="btn btn-circle btn-ghost"
				aria-label="GitHub"
				title="GitHub"
			>
				<span class="icon-[line-md--github-twotone]">GitHub</span>
			</a>
			<button
				type="button"
				class="btn btn-circle btn-ghost"
				aria-label="Email"
				title="Email"
				onclick={() => {
					const u = 'curt';
					const d = 'fauxfetus.net';
					window.location.href = `mailto:${u}@${d}`;
				}}
			>
				<span class="icon-[line-md--email-twotone]">Email</span>
			</button>
			<InstallAppButton />
		</div>
	</div>
</div>
