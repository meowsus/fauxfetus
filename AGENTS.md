# ⚠️ MANDATORY: Post-Task Verification

**After completing any code change, you MUST run the following commands before considering the task done:**

```sh
pnpm check
pnpm lint
pnpm format
```

- **`pnpm check`** — catches TypeScript and Svelte type errors.
- **`pnpm lint`** — catches formatting issues and ESLint violations.
- **`pnpm format`** — auto-fixes formatting with Prettier.

**Do not run `pnpm build` after every change** — it's slow (30+ seconds) and only needed for SSR/prerender verification or pre-deploy. See the **Build Verification** section below for when it's appropriate.

If any of the three mandatory commands fails, fix the issues and re-run all three until every one passes cleanly. **Do not skip this step. Do not consider a task complete until all three pass.**

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
├── packages/data-generator/      # @fauxfetus/data-generator workspace package
│   ├── index.ts
│   └── src/
│       └── DataGenerator.ts       # Reads audio metadata, builds catalog/tracks JSON
├── packages/validator/            # @fauxfetus/validator workspace package
│   ├── index.ts
│   └── src/
│       ├── ApeTag.ts              # APEv2 tag ID enum
│       ├── Validator.ts           # Validator class (mirrors DataGenerator shape) + static validate(tuples)
│       ├── types.ts               # Shared PathMetadataTuple
│       └── walk.ts                # readAudioMetadata() — klaw walker
├── scripts/
│   ├── data/generate.ts           # pnpm generate:data — runs DataGenerator
│   ├── data/validate.ts           # pnpm data:validate — runs validateAudio
│   ├── deploy.sh                  # Build + rsync deploy
│   └── release.sh                 # Version bump + release
├── static/
│   ├── audio/                     # Source MP3 files (input to generator)
│   └── data/                      # Generated: catalog.json, tracks.json
├── content.md                     # Homepage changelog (Markdown)
└── package.json                   # v2.7.0, pnpm monorepo
```

## Data Flow

1. `pnpm data:validate` → runs `scripts/data/validate.ts` → `Validator` (in `@fauxfetus/validator`) walks `static/audio/`, parses metadata, and returns a `ValidationSummary` (collecting all errors, no throw-on-first)
2. `pnpm generate:data` → runs `scripts/data/generate.ts` → `DataGenerator.create()` (in `@fauxfetus/data-generator`) calls `Validator.readAndValidate()` from `@fauxfetus/validator` as a constructor-time prerequisite. If any audio file is invalid, the full failure report is printed and an error is thrown — the generator object is never returned, so `run()` cannot be called. If validation passes, `run()` builds the catalog and writes JSON with no further validation.
3. Outputs `static/data/catalog.json` and `static/data/tracks.json`
4. At build time, `+page.server.ts` load functions call `readCatalog()` which reads `static/data/catalog.json`
5. `adapter-static` prerenders all pages — no runtime server

**Package dependency direction:** `data-generator` depends on `validator`. `validator` knows nothing about `data-generator`. This matches the natural relationship: "the audio directory has this contract" is a validator concern; "given valid audio, build a navigable catalog" is a generator concern.

**CLI script shape:** both `scripts/data/generate.ts` and `scripts/data/validate.ts` are thin shims — they define `READ_PATH` (and `WRITE_PATH` for generate), instantiate the package's main class, and call `run()`. The only CLI concerns that live in the scripts (rather than the packages) are `process.exit()` based on the result and any output formatting that requires the exit code.

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

- See **Mandatory Post-Task Verification** at the top of this file — always run `pnpm format` (alongside `pnpm check` and `pnpm lint`) after changes.
- Config: tabs, single quotes, trailing commas off, 100 char width.
- Plugins run automatically: `prettier-plugin-svelte`, `prettier-plugin-tailwindcss`, `prettier-plugin-organize-imports`.
- `tailwindStylesheet: "./src/app.css"` — class sorting uses your actual Tailwind config.

### Conventions

- Component style: `<script lang="ts">` with TypeScript.
- Utility classes: use `cn()` from `$lib/helpers/tailwind` (wraps `clsx` + `tailwind-merge`) when merging or conditionally applying classes. For static class strings with no merging needed, plain string classnames are fine.
- Import aliases: `$lib` for `src/lib/`.
- Data access: always go through `readCatalog()` in `$lib/helpers/catalog.ts` — it memoizes and reads from `static/data/catalog.json`.
- Type imports: `Artist`, `Album`, `Track`, etc. come from `@fauxfetus/data-generator`.

## Build Verification

- **`pnpm check`** is the primary verification after code changes — it catches TypeScript and Svelte type errors.
- **`pnpm build`** is slow (30+ seconds) and only needed to verify SSR/prerendering issues (e.g., `window` references during SSR) or before deployment. Do not run it after every code change — `pnpm check` is sufficient for routine changes.
- **`pnpm lint`** and **`pnpm format`** should still be run after changes.

| Scenario                                                         | Run `pnpm build`?              |
| ---------------------------------------------------------------- | ------------------------------ |
| Routine code change (components, helpers, etc.)                  | No — `pnpm check` is enough    |
| Adding/modifying a library that references `window`/browser APIs | Yes — verify SSR doesn't break |
| Changing SvelteKit config, adapters, or prerendering             | Yes                            |
| Before deployment                                                | Yes                            |

## Commands

| Command              | Purpose                                         | When to run                       | Allowed?  |
| -------------------- | ----------------------------------------------- | --------------------------------- | --------- |
| `pnpm dev`           | Start dev server                                | —                                 | No        |
| `pnpm build`         | Production build to `./build/`                  | SSR/prerender changes, pre-deploy | Yes       |
| `pnpm preview`       | Preview production build locally                | —                                 | Yes       |
| `pnpm check`         | Type-check with `svelte-check` + `tsc`          | After every code change           | Yes       |
| `pnpm lint`          | Prettier check + ESLint                         | After every code change           | Yes       |
| `pnpm format`        | Format all files with Prettier                  | After every code change           | Yes       |
| `pnpm generate:data` | Regenerate catalog/tracks JSON from audio files | —                                 | Yes       |
| `pnpm data:validate` | Validate audio files against schema/format/tags | —                                 | Yes       |
| `pnpm deploy:build`  | Build + rsync to server                         | —                                 | No, never |
| `pnpm release`       | Version bump + release                          | —                                 | No, never |

# Common Tasks

### Adding a new page route

1. Create `src/routes/path/+page.svelte` and `+page.server.ts`
2. If it needs URL params, use `[paramName]` directory (camelCase, matching existing slug convention)
3. Load functions can use `readCatalog()` from `$lib/helpers/catalog.ts`
4. **Run `pnpm check && pnpm lint && pnpm format`** and fix any errors

### Adding a new component

1. Create `src/lib/components/ComponentName.svelte` (or `ComponentName/index.svelte` for multi-file)
2. If reusable, export from `src/lib/index.ts`
3. **Run `pnpm check && pnpm lint && pnpm format`** and fix any errors

## Context7 (Documentation Lookup)

Use the `ctx7` CLI to fetch current documentation **before writing or modifying any code that uses Svelte, SvelteKit, daisyUI, Tailwind, or any other library** — even if you think you know the API. Your training data may not reflect recent changes (especially Svelte 5 runes, daisyUI 5 classes, Tailwind 4 directives).

### When to use

- **Writing or editing any `.svelte` file** → look up Svelte 5 syntax first (runes, snippets, props)
- **Adding or modifying a route / load function** → look up SvelteKit API first (load, actions, adapters, page options)
- **Styling with daisyUI classes** → look up daisyUI 5 component docs first (class names changed in v5)
- **Using Tailwind utilities or directives** → look up Tailwind 4 docs first (v4 uses CSS-based config, not `tailwind.config.js`)
- **Any task involving a library API, CLI tool, or SDK** → look it up first

### When NOT to use

- Refactoring without API changes
- Writing scripts from scratch with no library dependency
- Debugging business logic
- Code review
- General programming concepts

### Workflow

1. **Resolve the library** — `npx ctx7@latest library <name> "<query>"`
   - Use the official library name with proper punctuation (e.g. `"Next.js"` not `"nextjs"`, `"Three.js"` not `"threejs"`)
   - The query is required and directly affects result ranking — use the user's full question as the query
2. **Pick the best match** from the results by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results look wrong, try alternate names or rephrased queries.
3. **Fetch docs** — `npx ctx7@latest docs <libraryId> "<query>"`
   - Library IDs use `/org/project` format (e.g. `/sveltejs/kit`, `/saadeghi/daisyui`) — the `/` prefix is required
   - For version-specific docs, use `/org/project/version` from the `library` output (e.g. `/vercel/next.js/v14.3.0`)
4. **Answer using the fetched docs**

You MUST call `library` first to get a valid ID unless the user provides one directly in `/org/project` format. Do not run more than 3 commands per question. Do not include sensitive information (API keys, passwords, credentials) in queries.

If a command fails with a quota error, inform the user and suggest `npx ctx7@latest login` or setting `CONTEXT7_API_KEY` for higher limits. Do not silently fall back to training data.

### Key daisyUI 5 Notes

- daisyUI 5 requires Tailwind CSS 4 (`@import "tailwindcss";` + `@plugin "daisyui";` in CSS)
- Component classes are added directly to HTML elements alongside Tailwind utility classes
- Use daisyUI semantic color names (e.g., `bg-primary`, `text-base-content`) instead of Tailwind colors so themes work correctly
- If a component doesn't exist in daisyUI, create it with Tailwind CSS utilities
- Use `!` suffix on Tailwind classes (e.g., `bg-red-500!`) as a last resort to override specificity
- **This project uses the `dracula` daisyUI theme** (configured as default in `src/app.css`)
