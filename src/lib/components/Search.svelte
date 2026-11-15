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
	<label for="site-search">Search</label>
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
		<p role="status">{statusText}</p>
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
