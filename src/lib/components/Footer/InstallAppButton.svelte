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
	<!-- renders its own <li> (sibling of the footer's link items), so a
	 * hidden install button leaves no empty list item and the flex gap
	 * closes up around it -->
	<li><button type="button" onclick={handleInstallClick}>Install App</button></li>
{/if}

<style>
	/* same voice as the footer's caps links (it renders inside the <footer>
	 * nav, but lives in a child component — so it carries its own styles) */
	button {
		color: var(--dim);
		font-size: 0.7rem;
		font-weight: 500;
		letter-spacing: 0.26em;
		text-transform: uppercase;
		padding: 0.55em 0;
	}

	button:hover {
		color: var(--violet);
	}
</style>
