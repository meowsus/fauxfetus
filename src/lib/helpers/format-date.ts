const FORMATTER = new Intl.DateTimeFormat('en-US', {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
	timeZone: 'UTC'
});

const SHORT_FORMATTER = new Intl.DateTimeFormat('en-US', {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
	timeZone: 'UTC'
});

const MONTH_DAY_FORMATTER = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric',
	timeZone: 'UTC'
});

/**
 * '2026-11-14' -> 'November 14, 2026'.
 * Fixed locale + UTC so prerendered output is identical on every machine.
 */
export const formatDateLong = (iso: string): string => FORMATTER.format(new Date(iso));

/**
 * '2026-11-14' -> 'Nov 14, 2026' — the ledger/newslist date voice (the
 * caps styling uppercases it further in presentation).
 */
export const formatDateShort = (iso: string): string => SHORT_FORMATTER.format(new Date(iso));

/**
 * '2026-11-14' -> 'Nov 14' — the news archive entry date: the owning year
 * heads the group, so entries carry month + day only (caps voice uppercases).
 */
export const formatDateMonthDay = (iso: string): string =>
	MONTH_DAY_FORMATTER.format(new Date(iso));
