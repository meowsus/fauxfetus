// Shared helpers for rendering text-based "avatar" placeholders that mimic
// the visual variety of profile images: a colored disc with 1-2 letter
// initials. Used by ArtistList and AlbumList cards. The avatar color is
// derived from a stable hash of the slug so the same item always renders
// the same color across pages.

const PALETTE = [
	'bg-primary text-primary-content',
	'bg-secondary text-secondary-content',
	'bg-accent text-accent-content',
	'bg-info text-info-content',
	'bg-success text-success-content',
	'bg-warning text-warning-content'
] as const;

/** Deterministic 32-bit hash so the same slug always picks the same color. */
const hashSlug = (slug: string): number => {
	let hash = 0;

	for (let i = 0; i < slug.length; i++) {
		hash = (hash * 31 + slug.charCodeAt(i)) | 0;
	}

	return Math.abs(hash);
};

/** Pick a daisyUI palette class based on the slug. */
export const avatarColorClass = (slug: string): string => {
	return PALETTE[hashSlug(slug) % PALETTE.length];
};

/**
 * Shared class string for clickable cards in ArtistList / AlbumList.
 * Includes a hover effect (lift + deeper shadow + subtle bg shift) so each
 * card clearly reads as interactive. Kept here (rather than duplicated at
 * each call site) so the two lists can't drift apart visually.
 */
export const clickableCardClass =
	'card bg-base-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-base-300 hover:shadow-xl';

/**
 * Derive 1-2 letter initials from a display name.
 * - Strips a leading "The " so "The Beatles" -> "BE".
 * - Splits on whitespace and uses the first letter of up to the first two
 *   words, uppercased. Single-word names get their first two letters
 *   ("Radiohead" -> "RA"). Empty/whitespace input falls back to "?".
 */
export const initialsFromName = (name: string): string => {
	const stripped = name.replace(/^The\s+/i, '').trim();

	if (stripped.length === 0) return '?';

	const words = stripped.split(/\s+/);

	if (words.length === 1) {
		return words[0].slice(0, 2).toUpperCase();
	}

	return (words[0][0] + words[1][0]).toUpperCase();
};
