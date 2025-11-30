<script>
	import { resolve } from '$app/paths';

	import ThemeController from './ThemeController.svelte';
</script>

<div class="navbar rounded-lg bg-base-300 shadow-sm">
	<div class="navbar-start">
		<div class="dropdown">
			<div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h8m-8 6h16"
					/>
				</svg>
			</div>
			<ul tabindex="-1" class="dropdown-content menu z-1 mt-3 w-52 menu-lg bg-base-300 p-2 shadow">
				<li><a href={resolve('/artists')}>Artists</a></li>
			</ul>
		</div>
		<a href={resolve('/')} class="px-4 font-mono text-2xl">fauxfetus</a>
	</div>
	<div class="navbar-center hidden lg:flex">
		<ul class="menu menu-horizontal px-1">
			<li><a href={resolve('/artists')}>Artists</a></li>
		</ul>
	</div>
	<div class="navbar-end pr-4">
		<ThemeController />
	</div>
</div>
