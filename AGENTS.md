# Overview

You are working on **fauxfetus**, a static music catalog site for an independent label/collective. It's built with SvelteKit (Svelte 5) using `@sveltejs/adapter-static`. The production deploy process builds the site to `./build/` and `rsync`'s it to the server — there is **no server-side runtime**.

All site content (artists, albums, tracks) is generated at build time from JSON data files. The homepage also loads `content.md` (a changelog/blog) via `marked`.

## Project Structure

```
fauxfetus/
├── src/
│   ├── app.css                    # Tailwind 4 + daisyUI (dracula theme)
│   ├── app.html                   # HTML shell
│   ├── service-worker/index.ts    # PWA service worker
│   └── lib/
│       ├── index.ts               # Barrel exports
│       ├── context/
│       │   └── player.ts          # Svelte context for player state
│       ├── helpers/
│       │   ├── catalog.ts         # readCatalog() — loads static/data/catalog.json
│       │   ├── player.ts          # Player logic helpers
│       │   └── tailwind.ts        # cn() — clsx + tailwind-merge
│       └── components/
│           ├── AlbumList.svelte
│           ├── ArtistList.svelte
│           ├── TrackList.svelte
│           ├── Breadcrumb.svelte
│           ├── MetadataTable.svelte
│           ├── Navbar/            # Nav bar + install app button (PWA)
│           └── Player/            # Audio player (card, controls, progress)
├── src/routes/
│   ├── +layout.server.ts          # prerender = true, trailingSlash = 'always'
│   ├── +page.server.ts            # Home — loads content.md via marked
│   ├── +page.svelte               # Home page
│   ├── artists/
│   │   ├── +page.server.ts        # Lists all artists
│   │   ├── +page.svelte           # Artists listing with search
│   │   └── [artistSlug]/
│   │       ├── +page.server.ts    # Single artist + their albums
│   │       ├── +page.svelte
│   │       └── [albumSlug]/
│   │           ├── +page.server.ts    # Single album + tracks
│   │           ├── +page.svelte
│   │           └── [trackSlug]/
│   │               ├── +page.server.ts  # Single track + metadata
│   │               └── +page.svelte
│   └── sitemap.xml/+server.ts     # Sitemap generation
├── packages/generator/            # @fauxfetus/generator workspace package
│   ├── index.ts
│   └── src/
│       ├── DataGenerator.ts       # Reads audio files, outputs JSON
│       └── services/
│           └── ValidatorService.ts
├── scripts/
│   ├── data/generate.ts           # pnpm data:generate — runs DataGenerator
│   ├── deploy.sh                  # Build + rsync deploy
│   └── release.sh                 # Version bump + release
├── static/
│   ├── audio/                     # Source MP3 files (input to generator)
│   └── data/                      # Generated: catalog.json, tracks.json
├── content.md                     # Homepage changelog (Markdown)
└── package.json                   # v2.7.0, pnpm monorepo
```

## Data Flow

1. `pnpm data:generate` → runs `scripts/data/generate.ts`
2. `DataGenerator` reads audio files from `static/audio/` via `music-metadata`
3. Outputs `static/data/catalog.json` and `static/data/tracks.json`
4. At build time, `+page.server.ts` load functions call `readCatalog()` which reads `static/data/catalog.json`
5. `adapter-static` prerenders all pages — no runtime server

## Constraints

- **Static-only site**: No runtime server. All pages are prerendered. Do not add API routes that need a server.
- **Svelte 5 runes**: Use `$state`, `$derived`, `$effect` — not legacy `$:` reactive syntax. Use `$bindable` for props that need two-way binding.
- **Player state**: Managed via Svelte context (`createContext` / `setPlayerContext` / `getPlayerContext`), not a global store. The state type is `PlayerState` in `src/lib/context/player.ts`.
- **Trailing slashes**: `trailingSlash = 'always'` — routes must end with `/`.
- **Slug params**: Route params use camelCase (`artistSlug`, `albumSlug`, `trackSlug`).
- **PWA**: The site is installable as a PWA. The service worker is at `src/service-worker/index.ts`. PWA icons live in `static/icons/` (optional).
- **No test framework**: There is no test runner configured. Do not add one without explicit direction.

## Code Style

### Formatting

- Run `prettier` on individual files that have been modified, or `pnpm format` for all files.
- Config: tabs, single quotes, trailing commas off, 100 char width.
- Plugins run automatically: `prettier-plugin-svelte`, `prettier-plugin-tailwindcss`, `prettier-plugin-organize-imports`.
- `tailwindStylesheet: "./src/app.css"` — class sorting uses your actual Tailwind config.

### Conventions

- Component style: `<script lang="ts">` with TypeScript.
- Utility classes: use `cn()` from `$lib/helpers/tailwind` (wraps `clsx` + `tailwind-merge`) when merging or conditionally applying classes. For static class strings with no merging needed, plain string classnames are fine.
- Import aliases: `$lib` for `src/lib/`.
- Data access: always go through `readCatalog()` in `$lib/helpers/catalog.ts` — it memoizes and reads from `static/data/catalog.json`.
- Type imports: `Artist`, `Album`, `Track`, etc. come from `@fauxfetus/generator`.

# Commands

| Command              | Purpose                                                       | Allowed to run? |
| -------------------- | ------------------------------------------------------------- | --------------- |
| `pnpm dev`           | Start dev server                                              | No              |
| `pnpm build`         | Production build to `./build/`                                | Yes             |
| `pnpm preview`       | Preview production build locally                              | Yes             |
| `pnpm check`         | Type-check with `svelte-check` + `tsc` (incl. service-worker) | Yes             |
| `pnpm lint`          | Prettier check + ESLint                                       | Yes             |
| `pnpm format`        | Format all files with Prettier                                | Yes             |
| `pnpm data:generate` | Regenerate catalog/tracks JSON from audio files               | Yes             |
| `pnpm deploy:build`  | Build + rsync to server                                       | No, never       |
| `pnpm release`       | Version bump + release                                        | No, never       |

# Common Tasks

### Adding a new page route

1. Create `src/routes/path/+page.svelte` and `+page.server.ts`
2. If it needs URL params, use `[paramName]` directory (camelCase, matching existing slug convention)
3. Load functions can use `readCatalog()` from `$lib/helpers/catalog.ts`

### Adding a new component

1. Create `src/lib/components/ComponentName.svelte` (or `ComponentName/index.svelte` for multi-file)
2. If reusable, export from `src/lib/index.ts`

## Context7 MCP

You are able to use the Context7 MCP server, which resolves library names to up-to-date, versioned documentation. Use this instead of relying on training data for library APIs, component classes, or framework patterns. It covers Svelte, SvelteKit, daisyUI, Tailwind CSS, and any other library indexed by Context7.

### How to use

1. **Resolve the library ID first** — call `resolve-library-id` with a library name (e.g. `"/sveltejs/kit"`, `"/saadeghi/daisyui"`). This returns a Context7-compatible library ID.
2. **Fetch docs** — call `get-library-docs` with the resolved ID and an optional topic query to get targeted documentation snippets.

Always resolve before fetching. If you need docs for multiple libraries (e.g. SvelteKit + daisyUI), resolve each separately then fetch what you need.

### Key daisyUI 5 Notes

- daisyUI 5 requires Tailwind CSS 4 (`@import "tailwindcss";` + `@plugin "daisyui";` in CSS)
- Component classes are added directly to HTML elements alongside Tailwind utility classes
- Use daisyUI semantic color names (e.g., `bg-primary`, `text-base-content`) instead of Tailwind colors so themes work correctly
- If a component doesn't exist in daisyUI, create it with Tailwind CSS utilities
- Use `!` suffix on Tailwind classes (e.g., `bg-red-500!`) as a last resort to override specificity
- **This project uses the `dracula` daisyUI theme** (configured as default in `src/app.css`)
