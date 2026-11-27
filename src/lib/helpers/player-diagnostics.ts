/**
 * Client-side diagnostics for the Gapless5-backed player.
 *
 * Why this exists: a skip on a stressed connection can latch the engine into
 * a dead state that only an app restart clears — the audio element's `error`
 * event ends in a terminal Error state the library never reloads, and a
 * rejected `play()` promise can strand a source in its Starting state. This
 * site is static-only (no backend to receive logs), so the ring buffer lives
 * in localStorage, which survives the very app restart the user needs to
 * recover; the queue head's copy button dumps it after the fact.
 *
 * Events are transport-shaped — commands, callbacks, stalls — never
 * per-tick: the watchdog only writes when playback freezes while the engine
 * still claims to be playing, which is exactly the choke signature. Storage
 * failures (private mode, quota) degrade to silent memory-only logging;
 * diagnostics must never break playback.
 */

const STORAGE_KEY = 'ff-player-diag/v1';
const MAX_ENTRIES = 300;
const MAX_VALUE_CHARS = 160;

export type PlayerDiagEvent = string;
export type PlayerDiagData = Record<string, string | number | boolean>;

type PlayerDiagEntry = { t: string; e: PlayerDiagEvent; d?: PlayerDiagData };

let entries: PlayerDiagEntry[] | null = null;

/**
 * Browser context, probed through optional shapes so this module stays
 * import-safe under prerender (the Player component's script is imported
 * server-side even though nothing here runs there).
 */
function browserEnv(): { ua: string; online: boolean; visibility: string } {
	const g = globalThis as {
		navigator?: { userAgent: string; onLine: boolean };
		document?: { visibilityState: string };
	};
	return {
		ua: g.navigator?.userAgent ?? 'unavailable',
		online: g.navigator?.onLine ?? false,
		visibility: g.document?.visibilityState ?? 'unknown'
	};
}

function storage(): Storage | null {
	const s = (globalThis as { localStorage?: Storage }).localStorage;
	if (!s) return null;
	return s;
}

function load(): PlayerDiagEntry[] {
	if (entries) return entries;
	const s = storage();
	if (s) {
		try {
			const parsed: unknown = JSON.parse(s.getItem(STORAGE_KEY) ?? '[]');
			entries = Array.isArray(parsed) ? (parsed as PlayerDiagEntry[]) : [];
			return entries;
		} catch {
			// corrupt log — start fresh
		}
	}
	entries = [];
	return entries;
}

function persist(): void {
	const s = storage();
	if (!s) return;
	try {
		s.setItem(STORAGE_KEY, JSON.stringify(entries));
	} catch {
		// quota / private mode — logging must never break playback
	}
}

function clamp(value: string): string {
	return value.length > MAX_VALUE_CHARS ? `${value.slice(0, MAX_VALUE_CHARS)}…` : value;
}

// pi-lens-ignore: ast-grep-no-runtime-typeof — domain narrowing on the
// PlayerDiagData union; truncation is a string-only concern by design.
function sanitize(data: PlayerDiagData): PlayerDiagData {
	return Object.fromEntries(
		Object.entries(data).map(([key, value]) => [
			key,
			typeof value === 'string' ? clamp(value) : value
		])
	);
}

/** Append one transport event to the ring buffer and persist it. */
export function logPlayerEvent(event: PlayerDiagEvent, data?: PlayerDiagData): void {
	const list = load();
	const entry: PlayerDiagEntry = { t: new Date().toISOString(), e: event };
	if (data) entry.d = sanitize(data);
	list.push(entry);
	entries = list.slice(-MAX_ENTRIES);
	persist();
}

/** Human-readable export — one line per event, for pasting into a bug report. */
export function getPlayerDiagnosticDump(): string {
	const list = load();
	const { ua, online, visibility } = browserEnv();
	const head = [
		`fauxfetus player diagnostics — ${new Date().toISOString()} — ${list.length} entries`,
		`ua: ${ua}`,
		`online: ${online} · visibility: ${visibility}`
	];
	const lines = list.map(({ t, e, d }) => `${t}  ${e}${d ? `  ${JSON.stringify(d)}` : ''}`);
	return [...head, '---', ...lines].join('\n');
}
