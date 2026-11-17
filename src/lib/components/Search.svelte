<script lang="ts">
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import type { SearchIndexEntry, SearchIndexFile } from '@fauxfetus/data-generator';

	const MAX_RESULTS = 12;
	const MIN_QUERY_LENGTH = 2;

	let query = $state('');
	/* raw: the index is only ever replaced wholesale, never mutated — deep
	 * reactivity would put proxy overhead on every keystroke's scan. */
	let entries = $state.raw<SearchIndexEntry[]>([]);
	let indexState = $state<'idle' | 'loading' | 'ready' | 'failed'>('idle');
	let searchField: HTMLInputElement | undefined = $state();
	let resultsList: HTMLOListElement | undefined = $state();
	let searchRegion: HTMLDivElement | undefined = $state();
	/* Click-out dismissal: the panel hides when a pointer lands outside
	 * the search region; typing or refocusing the field brings it back
	 * (the query survives — dismissing is visibility, not a reset). */
	let dismissed = $state(false);

	/**
	 * Fetch the search index once. It's ~330 KB raw (every name and slug,
	 * nested so each is stored once), so it deliberately does not ride
	 * along with the initial page load — usually it's warmed by prefretch
	 * below, with first interaction as the fallback.
	 */
	async function ensureIndex(): Promise<void> {
		if (indexState !== 'idle') return;
		indexState = 'loading';
		try {
			const response = await fetch('/data/search-index.json');
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			entries = readSearchIndex(await response.json());
			indexState = 'ready';
		} catch (err) {
			console.error('Search index failed to load:', err);
			indexState = 'failed';
		}
	}

	/** Prefetch: warm the index shortly after load, off the interaction
	 * path. Fetching at focus/input once put the ~700 KB transfer squarely
	 * inside the visitor's first typed query, and the flush when it lands
	 * hitched mid-word ("b...eaut"). Warm early, type on a parsed index;
	 * data-saver visitors keep the fetch-on-demand path. */
	function warmIndex(): void {
		const connection = (navigator as { connection?: { saveData?: boolean } }).connection;
		if (connection?.saveData) return;
		if (typeof requestIdleCallback === 'function') {
			requestIdleCallback(() => void ensureIndex());
		} else {
			setTimeout(() => void ensureIndex(), 1200);
		}
	}

	if (browser) warmIndex();

	/** Normalize the index into flat entry records. The format is nested
	 * (artist → album → track, every name and slug stored once) and the
	 * parent chain fills in each placement; compilation tracks override
	 * the host artist with their own performing-artist fields where the
	 * index wrote them. Until a freshly-deployed service worker finishes
	 * installing, its version-keyed precache can still serve the previous
	 * generation's flat array — so flat payloads are accepted as-is. */
	function readSearchIndex(payload: unknown): SearchIndexEntry[] {
		if (!Array.isArray(payload)) throw new Error('Unexpected search index shape');
		const [first] = payload;
		if (first == null || !('albums' in first)) {
			return payload as SearchIndexEntry[];
		}

		const entries: SearchIndexEntry[] = [];
		for (const artist of payload as SearchIndexFile) {
			entries.push({ type: 'artist', name: artist.name, slug: artist.slug });
			for (const album of artist.albums) {
				entries.push({
					type: 'album',
					name: album.name,
					slug: album.slug,
					artistSlug: artist.slug,
					artistName: artist.name
				});
				for (const track of album.tracks) {
					entries.push({
						type: 'track',
						name: track.name,
						slug: track.slug,
						artistSlug: track.artistSlug ?? artist.slug,
						artistName: track.artistName ?? artist.name,
						albumSlug: album.slug
					});
				}
			}
		}
		return entries;
	}

	/* Score a token against one entry: the folded name may start with /
	 * contain the token (strongest), a word of the name may be its prefix /
	 * infix, or a word may be a close misspelling (typo tier, budget scaled
	 * by token length — a 3-char token must be near-exact so common short
	 * words don't fuzz). Best tier wins; null = the token misses the entry. */
	const MatchTypo = 1;
	const MatchInfix = 2;
	const MatchPrefix = 3;
	/* Entries are compared by catalog order within tiers; the multiplier
	 * packs (tier, index) into one comparable number — a single-tier gain
	 * outweighs any index separation (the array has ~3,870 entries). */
	const ORDINAL = 100_000;

	function foldText(text: string): string {
		return text
			.normalize('NFKD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase();
	}

	/** Collapse runs of a repeated letter — the doubled-keystroke class of
	 * misspelling ("babby", "beauuutiful") — used by the typo tier. */
	function squeeze(text: string): string {
		return text.replace(/(.)\1+/g, '$1');
	}

	/** Typo-tier budget by token length: ≤ 3 characters must be near-exact
	 * (too short to disambiguate corrections), then 1–2–3 edits by length. */
	function typoBudget(length: number): number {
		return length <= 3 ? 0 : length <= 5 ? 1 : length <= 8 ? 2 : 3;
	}

	/* Score one token against one entry. Checks run strongest first, and a
	 * word hit beats the whole-name fallback it generalizes: "beaut" scores
	 * as a prefix of "Beautiful", not an infix of the full name. */
	function matchToken(token: string, name: string, words: readonly string[]): number | null {
		for (const word of words) {
			if (word.startsWith(token)) return MatchPrefix;
		}
		if (name.startsWith(token)) return MatchPrefix;

		for (const word of words) {
			if (word.includes(token)) return MatchInfix;
		}
		/* Whole-name phrase fallback keeps the previous grammar exactly: any
		 * query the old single-phrase match found, this rule also finds. */
		if (name.includes(token)) return MatchInfix;

		/* Typo tier: bounded edit distance between the token and any word of
		 * the name, matched against the full word and against the word's
		 * leading characters (partial-spelling slop), with repeated-letter
		 * runs collapsed on both sides ("babby" still reaches "babies"). Each
		 * string pair uses a budget scaled to its own token length — squeezing
		 * "zzzz" down to "z" must not inherit the un-squeezed budget. Tokens
		 * ≤ 3 characters never fuzz. Subsequence/abbreviation matching stays
		 * out on purpose — that's where false positives flood. */
		const plainBudget = typoBudget(token.length);
		if (plainBudget === 0) return null;
		const tight = squeeze(token);
		const tightBudget = typoBudget(tight.length);
		const useSqueezed = tight !== token && tightBudget > 0;
		for (const word of words) {
			const loose = squeeze(word);
			if (
				editDistanceBounded(token, word, plainBudget) <= plainBudget ||
				editDistanceBounded(token, word.slice(0, token.length), plainBudget) <= plainBudget ||
				(useSqueezed &&
					(editDistanceBounded(tight, loose, tightBudget) <= tightBudget ||
						editDistanceBounded(tight, loose.slice(0, tight.length), tightBudget) <= tightBudget))
			) {
				return MatchTypo;
			}
		}
		return null;
	}

	/** Two-row Levenshtein with a length-diff prune and row-minimum early
	 * exit: bails as soon as every cell in the row is over budget. Returns
	 * budget+1 (not the true distance) when the bound is exceeded — callers
	 * only compare against the budget. */
	function editDistanceBounded(token: string, word: string, budget: number): number {
		if (token === word) return 0;
		const width = word.length;
		if (Math.abs(token.length - width) > budget) return budget + 1;

		let previous = new Array<number>(width + 1);
		for (let j = 0; j <= width; j += 1) previous[j] = j;

		for (let i = 1; i <= token.length; i += 1) {
			const current = [i];
			let rowMin = i;
			for (let j = 1; j <= width; j += 1) {
				const cost = token[i - 1] === word[j - 1] ? 0 : 1;
				const distance = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
				current.push(distance);
				if (distance < rowMin) rowMin = distance;
			}
			if (rowMin > budget) return budget + 1;
			previous = current;
		}
		const distance = previous[width];
		return distance <= budget ? distance : budget + 1;
	}

	/** Identity across the index. The catalog legitimately contains
	 * indistinguishable placements (several "untitled" tracks in one album,
	 * a track listed on both sides of a split), so deduping by this key
	 * keeps the results each's keys unique — Svelte treats duplicate keys
	 * as a client error and the list render breaks from the first dupe on. */
	function entryKey(entry: SearchIndexEntry): string {
		return `${entry.type}:${entry.artistSlug ?? ''}/${entry.albumSlug ?? ''}/${entry.slug}`;
	}

	const search = $derived.by(() => {
		const q = foldText(query.trim());
		if (indexState !== 'ready' || q.length < MIN_QUERY_LENGTH) {
			return { list: [] as SearchIndexEntry[], total: 0, strongCount: 0 };
		}

		/* Multi-word queries match with AND semantics — every token must hit
		 * somewhere; a single phrase "beaut babies" used to find nothing. */
		const tokens = q.split(/[^a-z0-9]+/).filter((t) => t.length >= 2);
		if (tokens.length === 0) {
			return { list: [] as SearchIndexEntry[], total: 0, strongCount: 0 };
		}

		/* Candidates keep (entry, order=entry score) and bucket into strong
		 * (every token hit by prefix/infix, no typo help) vs fuzzy (some
		 * token needed corrected spelling). Within a bucket, higher score
		 * wins; ties keep catalog order. */
		type Candidate = { entry: SearchIndexEntry; order: number };
		const strong: Candidate[] = [];
		const fuzzy: Candidate[] = [];
		const seen: string[] = [];
		let total = 0;

		for (let index = 0; index < entries.length; index += 1) {
			const entry = entries[index];
			const key = entryKey(entry);
			if (seen.includes(key)) continue;

			const name = foldText(entry.name);
			const words = name.split(/[^a-z0-9]+/);

			let min = MatchPrefix;
			let scored = true;
			for (const token of tokens) {
				const score = matchToken(token, name, words);
				if (score === null) {
					scored = false;
					break;
				}
				min = Math.min(min, score);
			}
			if (!scored) continue;

			seen.push(key);
			total += 1;
			(min === MatchTypo ? fuzzy : strong).push({ entry, order: index - min * ORDINAL });
		}

		const list = [...strong, ...fuzzy]
			.sort((a, b) => a.order - b.order)
			.slice(0, MAX_RESULTS)
			.map((candidate) => candidate.entry);
		return { list, total, strongCount: Math.min(strong.length, list.length) };
	});

	/** Keyboard access for the results: ↓ from the field moves focus into
	 * the list, ↓/↑ walk the links and wrap back to the field at both ends,
	 * Escape clears the query and returns focus to the field. The links
	 * themselves stay Tab- and Enter-accessible as native anchors. */
	function handleFieldKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape') {
			query = '';
			return;
		}
		if (event.key === 'ArrowDown' && search.list.length > 0) {
			event.preventDefault();
			resultsList?.querySelector<HTMLAnchorElement>('li a')?.focus();
		}
	}

	function handleResultsKeydown(event: KeyboardEvent): void {
		const anchor = (event.target as HTMLElement | null)?.closest('a');
		if (!(anchor instanceof HTMLElement)) return;
		const anchors = [...(resultsList?.querySelectorAll<HTMLAnchorElement>('li a') ?? [])];
		const here = anchors.indexOf(anchor);
		if (event.key === 'Escape') {
			event.preventDefault();
			query = '';
			searchField?.focus();
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			(here + 1 < anchors.length ? anchors[here + 1] : searchField)?.focus();
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			(here > 0 ? anchors[here - 1] : searchField)?.focus();
		}
	}

	/** Click-out dismissal: a pointerdown outside the search region hides
	 * the results panel; the handlers below reopen it on interaction. */
	function handleDocumentPointerdown(event: PointerEvent): void {
		if (!searchRegion) return;
		if (event.target instanceof Node && searchRegion.contains(event.target)) return;
		dismissed = true;
	}

	function handleFieldFocus(): void {
		dismissed = false;
		void ensureIndex();
	}

	function handleFieldInput(): void {
		dismissed = false;
		void ensureIndex();
	}

	/** Picking a result ends the search: the panel is done once the
	 * visitor has navigated — it must not trail them to the target page. */
	function closeResults(): void {
		query = '';
	}

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

<svelte:document onpointerdown={handleDocumentPointerdown} />

<div role="search" bind:this={searchRegion}>
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
		placeholder="search anything"
		aria-controls="search-results"
		bind:this={searchField}
		bind:value={query}
		onfocus={handleFieldFocus}
		oninput={handleFieldInput}
		onkeydown={handleFieldKeydown}
	/>

	{#if statusText && !dismissed}
		<p role="status" class={search.list.length ? 'vh' : 'status'}>{statusText}</p>
	{/if}

	{#if search.list.length && !dismissed}
		<ol id="search-results" aria-label="Search results" bind:this={resultsList}>
			{#each search.list.slice(0, search.strongCount) as entry (entryKey(entry))}
				<li>
					<small>{entry.type}</small>
					<a
						href={resolve(entryHref(entry))}
						title={entryLabel(entry)}
						onkeydown={handleResultsKeydown}
						onclick={closeResults}>{entryLabel(entry)}</a
					>
				</li>
			{/each}
			{#if search.strongCount < search.list.length}
				<li class="fuzz-gap">≈ close matches</li>
			{/if}
			{#each search.list.slice(search.strongCount) as entry (entryKey(entry))}
				<li>
					<small>{entry.type}</small>
					<a
						href={resolve(entryHref(entry))}
						title={entryLabel(entry)}
						onkeydown={handleResultsKeydown}
						onclick={closeResults}>{entryLabel(entry)}</a
					>
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

	/* phone and tablet keep the full-width panel (an extension of the boxed
	 * full-width field); only the ≥64em quiet field gets the popover that
	 * hugs its content — see the ≥64em block below */

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

	/* the divider row between exact-tier and typo-tier results */
	li.fuzz-gap {
		color: var(--dim);
		font-size: 0.62rem;
		font-weight: 500;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		border-top: 1px solid var(--hair);
		margin-top: 0.25rem;
		padding-top: 0.6em;
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
			/* empty field: only the (right-aligned) placeholder shows */
			text-align: right;
			padding: 0.45em 0;
		}

		/* anything the visitor actually types reads left-aligned */
		[role='search'] input:not(:placeholder-shown) {
			text-align: left;
		}

		/* the popover hugs its content — a short result set makes a small
		 * panel, longer matches widen it, capped at a third of the shell —
		 * anchored to the field's right edge and grown leftward */
		ol {
			left: auto;
			width: max-content;
			max-width: calc(var(--shell) / 3);
		}
	}
</style>
