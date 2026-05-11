let sentinel: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<void> {
	if (!('wakeLock' in navigator)) return;

	// Don't request if we already hold an active lock
	if (sentinel && !sentinel.released) return;

	try {
		sentinel = await navigator.wakeLock.request('screen');
	} catch {
		// Request can fail if the page isn't visible (e.g. screen just
		// turned off). This is expected — we re-acquire when the page
		// becomes visible again via the visibilitychange handler.
	}
}

export async function releaseWakeLock(): Promise<void> {
	if (!sentinel?.released) {
		await sentinel?.release();
	}
	sentinel = null;
}
