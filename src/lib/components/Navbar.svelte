<script>
	import { resolve } from '$app/paths';

	import ThemeController from './ThemeController.svelte';
</script>

<div class="navbar bg-base-100 shadow-sm">
	<div class="container mx-auto flex items-center px-4">
		<div class="flex-1">
			<a href={resolve('/')} class="btn font-mono text-2xl btn-ghost">fauxfetus</a>
		</div>

		<div class="flex-none">
			<ThemeController />
		</div>
	</div>
</div>
