const FORMATTER = new Intl.DateTimeFormat('en-US', {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
	timeZone: 'UTC'
});

/**
 * '2026-11-14' -> 'November 14, 2026'.
 * Fixed locale + UTC so prerendered output is identical on every machine.
 */
export const formatDateLong = (iso: string): string => FORMATTER.format(new Date(iso));
