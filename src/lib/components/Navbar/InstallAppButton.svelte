<script lang="ts">
	import { browser } from '$app/environment';

	interface InstallPromptEvent {
		prompt(): Promise<void>;
		userChoice: Promise<{ outcome: string }>;
	}

	let installPrompt = $state<InstallPromptEvent | null>(null);
	let isInstalled = $state(false);

	if (browser) {
		const nav = window.navigator as Navigator & { standalone?: boolean };
		isInstalled =
			window.matchMedia('(display-mode: standalone)').matches ||
			Boolean('standalone' in nav && nav.standalone);

		window.addEventListener('beforeinstallprompt', (e: Event) => {
			e.preventDefault();
			installPrompt = e as unknown as InstallPromptEvent;
		});

		window.addEventListener('appinstalled', () => {
			installPrompt = null;
			isInstalled = true;
		});
	}

	const showInstall = $derived(Boolean(installPrompt && !isInstalled));

	function handleInstallClick() {
		if (!installPrompt) return;
		installPrompt.prompt();
		installPrompt.userChoice.then((choice) => {
			if (choice.outcome === 'accepted') installPrompt = null;
		});
	}
</script>

{#if showInstall}
	<button
		type="button"
		class="btn btn-circle btn-ghost"
		onclick={handleInstallClick}
		title="Install app"
	>
		<span class="icon-[line-md--download-twotone-loop]">Install App</span>
	</button>
{/if}
