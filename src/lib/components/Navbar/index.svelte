<script lang="ts">
	import { page } from '$app/state';
	import { resolve, asset } from '$app/paths';
	import { getPlayerActions, getPlayerContext } from '#lib/context/player.js';
	import Search from '#lib/components/Search.svelte';
	import { startRadio } from '#lib/helpers/index.js';

	const playerStore = getPlayerContext();
	const playerActionsStore = getPlayerActions();

	function handleRadioStart(): void {
		startRadio(playerStore, $playerActionsStore);
	}
</script>

<header>
	{#if page.url.pathname !== '/'}
		<a class="mark" href={resolve('/')} aria-label="Faux Fetus home">
			<img src={asset('icons/mark.svg')} alt="" width="350" height="300" decoding="async" />
		</a>
	{/if}
	<nav aria-label="Main">
		<ul>
			<li><a href={resolve('artists/')}>Artists ({page.data.artistCount})</a></li>
			<li><a href={resolve('news/')}>News</a></li>
			<li><button type="button" onclick={handleRadioStart}>Radio</button></li>
		</ul>
	</nav>
	<Search />
</header>

<style>
	/* ── header — the mark lives here (direct child), caps stay the nav's
	   voice. Grid: mark column | nav row, search row below (full-width on
	   phone, quiet underline field at ≥64em — see Search's own styles). ── */
	header {
		padding-top: 1.1rem;
		display: grid;
		grid-template-columns: 2.25rem minmax(0, 1fr);
		grid-template-rows: minmax(2.25rem, auto) auto;
		column-gap: 1.1rem;
	}

	.mark {
		display: block;
		position: relative;
		grid-column: 1;
		grid-row: 1;
		align-self: stretch;
	}

	/* mark.svg: white blob, lettering knocked out against the page bg */
	.mark img {
		position: absolute;
		inset: 0;
		height: 100%;
		width: 100%;
		object-fit: contain;
		object-position: left center;
	}

	nav[aria-label='Main'] {
		grid-column: 2;
		grid-row: 1;
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	nav ul {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 1rem;
		padding: 0;
		margin: 0;
		justify-content: flex-end;
	}

	/* caps are the nav's voice (repetition is the point); 0.55em vertical
	   padding makes the whole header an honest touch target */
	nav[aria-label='Main'] a,
	nav[aria-label='Main'] button {
		color: var(--dim);
		font-size: 0.7rem;
		font-weight: 500;
		letter-spacing: 0.26em;
		text-transform: uppercase;
		display: inline-block;
		padding: 0.55em 0;
	}

	nav[aria-label='Main'] a:hover,
	nav[aria-label='Main'] button:hover {
		color: var(--violet);
	}

	@media (min-width: 48em) {
		nav[aria-label='Main'] {
			gap: 2rem;
		}

		nav ul {
			gap: 0.4rem 1.3rem;
		}
	}

	@media (min-width: 64em) {
		/* masthead: mark column = nav row + search row exactly; fixed track
		   heights keep the header at its original size */
		header {
			grid-template-columns: 5.25rem minmax(0, 1fr);
			grid-template-rows: 2.25rem 3rem;
			column-gap: 2rem;
		}

		.mark {
			grid-row: 1 / span 2;
		}

		nav[aria-label='Main'] {
			grid-row: 1;
		}
	}
</style>
