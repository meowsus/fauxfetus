<script lang="ts">
	import { resolve } from '$app/paths';
	import type { SearchIndexEntry } from '@fauxfetus/data-generator';

	const MAX_RESULTS = 12;
	const MIN_QUERY_LENGTH = 2;

	let query = $state('');
	let entries: SearchIndexEntry[] = $state([]);
	let indexState = $state<'idle' | 'loading' | 'ready' | 'failed'>('idle');

	/**
	 * Fetch the search index once, on first interaction. It's ~700 KB raw
	 * (all names + slugs), so it deliberately does not ride along with the
	 * initial page load.
	 */
	async function ensureIndex(): Promise<void> {
		if (indexState !== 'idle') return;
		indexState = 'loading';
		try {
			const response = await fetch('/data/search-index.json');
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			entries = await response.json();
			indexState = 'ready';
		} catch (err) {
			console.error('Search index failed to load:', err);
			indexState = 'failed';
		}
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Escape') query = '';
	}

	const search = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (indexState !== 'ready' || q.length < MIN_QUERY_LENGTH) {
			return { list: [] as SearchIndexEntry[], total: 0 };
		}

		const startsWith: SearchIndexEntry[] = [];
		const includes: SearchIndexEntry[] = [];
		let total = 0;

		for (const entry of entries) {
			const name = entry.name.toLowerCase();
			if (!name.includes(q)) continue;
			total += 1;
			(name.startsWith(q) ? startsWith : includes).push(entry);
		}

		return { list: [...startsWith, ...includes].slice(0, MAX_RESULTS), total };
	});

	/** Announced via role="status" so screen readers report result counts
	 * as the query changes. */
	const statusText = $derived.by(() => {
		if (indexState === 'loading') return 'Loading search index…';
		if (indexState === 'failed') return 'Search is unavailable.';
		const q = query.trim();
		if (q.length < MIN_QUERY_LENGTH) return '';
		if (search.total === 0) return `No results for "${q}"`;
		return `${search.total} result${search.total === 1 ? '' : 's'} for "${q}"`;
	});

	/** Result URLs for resolve(): the return type is a pathname-template union
	 * matching SvelteKit's generated route unions — a plain `string` return
	 * would be rejected by the strictly-typed resolve(). */
	type EntryHref =
		| `/artists/${string}`
		| `/artists/${string}/${string}`
		| `/artists/${string}/${string}/${string}`;

	function entryHref(entry: SearchIndexEntry): EntryHref {
		if (entry.type === 'artist') return `/artists/${entry.slug}`;
		if (entry.type === 'album') return `/artists/${entry.artistSlug}/${entry.slug}`;
		return `/artists/${entry.artistSlug}/${entry.albumSlug}/${entry.slug}`;
	}

	function entryLabel(entry: SearchIndexEntry): string {
		if (entry.type === 'artist') return entry.name;
		return entry.artistName ? `${entry.name} — ${entry.artistName}` : entry.name;
	}
</script>

<div role="search">
	<label class="vh" for="site-search">Search</label>
	<svg
		width="15"
		height="15"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg
	>
	<input
		id="site-search"
		type="search"
		autocomplete="off"
		placeholder="Artists, albums, tracks…"
		bind:value={query}
		onfocus={ensureIndex}
		oninput={ensureIndex}
		onkeydown={handleKeyDown}
	/>

	{#if statusText}
		<p role="status" class={search.list.length ? 'vh' : 'status'}>{statusText}</p>
	{/if}

	{#if search.list.length}
		<ol>
			{#each search.list as entry (`${entry.type}:${entry.artistSlug ?? ''}/${entry.albumSlug ?? ''}/${entry.slug}`)}
				<li>
					<small>{entry.type}</small>
					<a href={resolve(entryHref(entry))}>{entryLabel(entry)}</a>
				</li>
			{/each}
		</ol>
	{/if}
</div>

<style>
	/* The search lives in the header grid (see Navbar): full-width boxed
	 * field on phone/tablet, quiet underline field at ≥64em — the menu
	 * leads, search whispers. */
	[role='search'] {
		grid-column: 1 / -1;
		grid-row: 2;
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.55rem;
		margin-top: 1.2rem;
		background: rgb(236 233 244 / 0.055);
		border: 1px solid rgb(236 233 244 / 0.18);
		border-radius: 10px;
		padding: 0 0.9rem;
	}

	[role='search'] svg {
		flex: none;
		color: var(--dim);
	}

	[role='search'] input {
		width: 100%;
		background: none;
		border: 0;
		color: var(--ink);
		font-family: inherit;
		font-size: 1rem; /* ≥16px: iOS Safari must not zoom on focus */
		padding: 0.72em 0;
	}

	[role='search'] input::placeholder {
		color: var(--dim);
	}

	[role='search']:focus-within {
		border-color: var(--violet);
		background: rgb(236 233 244 / 0.08);
	}

	.status {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		color: var(--dim);
		font-size: 0.78rem;
	}

	ol {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		right: 0;
		z-index: 20;
		list-style: none;
		margin: 0;
		padding: 0.35rem;
		background: rgb(19 20 27 / 0.97);
		backdrop-filter: blur(18px);
		border: 1px solid rgb(236 233 244 / 0.18);
		border-radius: 10px;
		box-shadow: 0 12px 32px rgb(0 0 0 / 0.5);
	}

	li {
		display: flex;
		align-items: baseline;
		gap: 0.6em;
		padding: 0.35em 0.6em;
	}

	li small {
		color: var(--dim);
		font-size: 0.62rem;
		font-weight: 500;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		flex: none;
		min-width: 3.2rem;
	}

	li a {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	li a:hover {
		color: var(--violet);
	}

	@media (min-width: 64em) {
		[role='search'] {
			grid-column: 2;
			grid-row: 2;
			align-self: end;
			max-width: 19rem;
			margin-top: 0;
			margin-left: auto;
			flex-direction: row-reverse;
			/* desktop: quiet underline field */
			background: none;
			border-width: 0 0 1px;
			border-radius: 0;
			padding: 0 0.2rem;
		}

		[role='search']:focus-within {
			background: none;
			border-bottom-color: var(--violet);
		}

		[role='search'] input {
			text-align: right;
			padding: 0.45em 0;
		}
	}
</style>
