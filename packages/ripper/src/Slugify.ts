import slugify from 'slugify';

/**
 * Path-safe slug helper. Mirrors the generator's `createSlug` exactly
 * (same `slugify` library, same `{ lower: true, strict: true }` options)
 * so artist/album/track slugs derived here match the slugs the generator
 * derives from tag values downstream.
 */
export const createSlug = (str: string): string => slugify(str, { lower: true, strict: true });
