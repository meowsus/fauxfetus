<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PrunedMetadata } from '@fauxfetus/data-generator';

	/** Catalog routes behind the Tags group's linked rows (same shapes the
	 *  breadcrumb items use). */
	type CatalogPath = `artists/${string}` | `artists/${string}/${string}`;

	interface TagRow {
		label: string;
		value: string;
		href?: CatalogPath;
	}

	interface Props {
		metadata: PrunedMetadata | undefined;
		/** Catalog routes for the Tags group's Artist and Album rows. The text
		 *  stays the file's embedded value — which can drift from the catalog's
		 *  names — but the link leads to the real pages. */
		links?: { artist?: CatalogPath; album?: CatalogPath };
		/** Catalog placement label ("7 of 12") for the Tags group's Track row;
		 *  the embedded tag numbering only wins when this is not provided. */
		trackLabel?: string;
	}

	let { metadata, links = {}, trackLabel }: Props = $props();

	function formatDuration(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function formatBitrate(bps: number): string {
		return `${Math.round(bps / 1000)} kbps`;
	}

	function formatSampleRate(hz: number): string {
		return `${(hz / 1000).toFixed(1)} kHz`;
	}

	/** Container/codec facts — the "Audio" group. */
	const audioRows = $derived(
		metadata
			? [
					{ label: 'Container', value: metadata.format.container },
					{ label: 'Codec', value: metadata.format.codec },
					...(metadata.format.codecProfile
						? [{ label: 'Profile', value: metadata.format.codecProfile }]
						: []),
					{ label: 'Bitrate', value: formatBitrate(metadata.format.bitrate ?? 0) },
					{ label: 'Sample rate', value: formatSampleRate(metadata.format.sampleRate ?? 0) },
					{
						label: 'Channels',
						value:
							metadata.format.numberOfChannels === undefined
								? '—'
								: String(metadata.format.numberOfChannels)
					},
					{ label: 'Duration', value: formatDuration(metadata.format.duration ?? 0) },
					{ label: 'Lossless', value: metadata.format.lossless ? 'Yes' : 'No' }
				]
			: []
	);

	/** Title/artist/album/track tag values — the "Tags" group. Text values
	    are the file's embedded ones, which can drift from the catalog's
	    names; Artist and Album links resolve through the catalog, and the
	    Track row prefers the caller's catalog "X of Y" placement label. */
	const tagRows: TagRow[] = $derived(
		metadata
			? [
					...(metadata.common.title ? [{ label: 'Title', value: metadata.common.title }] : []),
					...(metadata.common.artist
						? [{ label: 'Artist', value: metadata.common.artist, href: links.artist }]
						: []),
					...(metadata.common.album
						? [{ label: 'Album', value: metadata.common.album, href: links.album }]
						: []),
					...(trackLabel
						? [{ label: 'Track', value: trackLabel }]
						: metadata.common.track?.no != null
							? [
									{
										label: 'Track',
										value:
											metadata.common.track.of != null
												? `${metadata.common.track.no} / ${metadata.common.track.of}`
												: String(metadata.common.track.no)
									}
								]
							: []),
					...(metadata.common.disk?.no != null
						? [
								{
									label: 'Disc',
									value:
										metadata.common.disk.of != null
											? `${metadata.common.disk.no} / ${metadata.common.disk.of}`
											: String(metadata.common.disk.no)
								}
							]
						: [])
				]
			: []
	);

	/** APEv2-only tags beyond the common five — the "APEv2" group. Tag ids are
	    stored shouty; the label is UI voice, the value stays raw. COMPOSER is
	    suppressed: track metadata never shows composer information. */
	const prettifyTagId = (id: string): string =>
		id
			.trim()
			.toLowerCase()
			.replace(/\b[a-z]/g, (char) => char.toUpperCase());

	const apeRows = $derived.by(() => {
		if (!metadata?.native?.APEv2?.length) return [];
		const hiddenKeys = new Set(['TITLE', 'ARTIST', 'ALBUM', 'TRACK', 'DISC', 'COMPOSER']);
		return metadata.native.APEv2.filter(
			(tag) => !hiddenKeys.has(String(tag.id).trim().toUpperCase())
		).map((tag) => ({ label: prettifyTagId(tag.id), value: String(tag.value) }));
	});

	const hasRows = $derived(audioRows.length + tagRows.length + apeRows.length > 0);
</script>

{#if !metadata}
	<p class="note">No metadata available.</p>
{:else if hasRows}
	<dl class="meta tnum">
		{#if tagRows.length > 0}
			<dt class="grp">Tags</dt>
			{#each tagRows as { label, value, href } (label)}
				<div class="row">
					<dt>{label}</dt>
					<dd>
						{#if href}<a href={resolve(href)}>{value}</a>{:else}{value}{/if}
					</dd>
				</div>
			{/each}
		{/if}
		<dt class="grp">Audio</dt>
		{#each audioRows as { label, value } (label)}
			<div class="row">
				<dt>{label}</dt>
				<dd>{value}</dd>
			</div>
		{/each}
		{#if apeRows.length > 0}
			<dt class="grp">APEv2</dt>
			{#each apeRows as { label, value } (label)}
				<div class="row">
					<dt>{label}</dt>
					<dd>{value}</dd>
				</div>
			{/each}
		{/if}
	</dl>
{/if}
