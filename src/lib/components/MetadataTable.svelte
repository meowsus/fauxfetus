<script lang="ts">
	import type { Track } from '@fauxfetus/generator';

	interface Props {
		metadata: Track['metadata'];
	}

	let { metadata }: Props = $props();

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

	const formatRows = $derived(
		metadata
			? [
					{ label: 'Container', value: metadata.format.container },
					{ label: 'Codec', value: metadata.format.codec },
					...(metadata.format.codecProfile
						? [{ label: 'Profile', value: metadata.format.codecProfile }]
						: []),
					{ label: 'Bitrate', value: formatBitrate(metadata.format.bitrate ?? 0) },
					{ label: 'Sample rate', value: formatSampleRate(metadata.format.sampleRate ?? 0) },
					{ label: 'Channels', value: metadata.format.numberOfChannels ?? '—' },
					{ label: 'Duration', value: formatDuration(metadata.format.duration ?? 0) },
					{ label: 'Lossless', value: metadata.format.lossless ? 'Yes' : 'No' }
				]
			: []
	);

	const commonRows = $derived(
		metadata
			? [
					...(metadata.common.title ? [{ label: 'Title', value: metadata.common.title }] : []),
					...(metadata.common.artist ? [{ label: 'Artist', value: metadata.common.artist }] : []),
					...(metadata.common.album ? [{ label: 'Album', value: metadata.common.album }] : []),
					...(metadata.common.track?.no != null
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

	const nativeRows = $derived.by(() => {
		if (!metadata?.native?.APEv2?.length) return [];
		const commonKeys = new Set(['TITLE', 'ARTIST', 'ALBUM', 'COMPOSER', 'TRACK', 'DISC']);
		return metadata.native.APEv2.filter(
			(tag) => !commonKeys.has(String(tag.id).trim().toUpperCase())
		).map((tag) => ({ label: tag.id, value: tag.value }));
	});

	const tableRows = $derived([...formatRows, ...commonRows, ...nativeRows]);
</script>

{#if !metadata}
	<p class="text-base-content/70">No metadata available.</p>
{:else if tableRows.length > 0}
	<div class="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
		<table class="table">
			<thead>
				<tr>
					<th>Metadata</th>
					<th>Value</th>
				</tr>
			</thead>
			<tbody>
				{#each tableRows as { label, value } (label)}
					<tr>
						<th>{label}</th>
						<td>{value}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
