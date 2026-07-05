import fs from 'fs-extra';

const PREAMBLE = 'APETAGEX';
const VERSION = 2000; // APEv2.0
// APEv2 footer/header flags (matches the TagLib ApeTagFooterFlags layout,
// which is what music-metadata's parseTagFlags decodes):
//   bit 31 (0x80000000) = containsHeader / HeaderPresent
//   bit 30 (0x40000000) = containsFooter (FooterAbsent in TagLib; left clear)
//   bit 29 (0x20000000) = isHeader
// The header sets HeaderPresent + IsHeader; the footer sets HeaderPresent
// only (IsHeader clear, so readers know this is the footer).
const FLAG_HEADER = (0x80000000 | 0x20000000) >>> 0; // HeaderPresent | IsHeader (0xA0000000)
const FLAG_FOOTER = 0x80000000 >>> 0; // HeaderPresent, IsHeader clear (this is the footer)
const FLAG_ITEM_TEXT = 0x00000000; // text item
const RESERVED = Buffer.alloc(8, 0);

/**
 * Minimal APEv2 tag writer. The format is:
 *
 *   [PREAMBLE "APETAGEX"][VERSION uint32][SIZE uint32][COUNT uint32]
 *   [FLAGS uint32][RESERVED int64]            ← header
 *   ...for each item:
 *     [SIZE uint32][FLAGS uint32][KEY\0][VALUE bytes]
 *   [PREAMBLE "APETAGEX"][VERSION uint32][SIZE uint32][COUNT uint32]
 *   [FLAGS uint32 (bit 31 set)][RESERVED int64] ← footer
 *
 * `SIZE` is the size of all items plus the footer (header excluded when
 * a footer is present). All tag values here are UTF-8 text (flags = 0).
 */
export class Apev2Writer {
	/**
	 * Write APEv2 tags to an MP3 file. Strips any existing APEv2, ID3v1,
	 * and ID3v2 tags first so the validator sees exactly one tag type.
	 * Overwrites any existing APEv2 tag.
	 */
	static async write(filePath: string, tags: Record<string, string>): Promise<void> {
		const original = await fs.readFile(filePath);
		const audioData = Apev2Writer.stripTags(original);
		const tagBuffer = Apev2Writer.buildTag(tags);
		await fs.writeFile(filePath, Buffer.concat([audioData, tagBuffer]));
	}

	/**
	 * Remove ID3v2 (start), ID3v1 (end), and APEv2 (end) tags from a buffer,
	 * returning just the audio payload. The validator requires exactly one
	 * tag type, so we must be sure no stale tags remain before writing the
	 * fresh APEv2 tag.
	 */
	private static stripTags(buf: Buffer): Buffer {
		let start = 0;
		let end = buf.length;

		// ID3v2: at the start of the file, begins with "ID3". The header is
		// 10 bytes; bytes 7-9 are the size as a synchsafe int (7 bits each).
		if (buf.length >= 10 && buf.subarray(0, 3).toString('ascii') === 'ID3') {
			const size =
				((buf[6] & 0x7f) << 21) |
				((buf[7] & 0x7f) << 14) |
				((buf[8] & 0x7f) << 7) |
				(buf[9] & 0x7f);
			start = 10 + size;
		}

		// ID3v1: last 128 bytes if they start with "TAG".
		if (buf.length - end >= 128 && buf.subarray(end - 128, end - 125).toString('ascii') === 'TAG') {
			end -= 128;
		}

		// APEv2: footer at the end of the file, begins with "APETAGEX". The
		// footer's SIZE field (bytes 12-15) = all items + the 32-byte footer
		// (the header is NOT counted). If the footer's flags indicate a header
		// is present, a 32-byte header precedes the items and must also be
		// removed — otherwise a re-rip would leave a stale header dangling.
		const footerOffset = Apev2Writer.findApev2Footer(buf, 0, end);
		if (footerOffset !== -1) {
			const size = buf.readUInt32LE(footerOffset + 12);
			const flags = buf.readUInt32LE(footerOffset + 20);
			const hasHeader = (flags & 0x80000000) !== 0; // bit 31 = containsHeader
			const totalTagSize = size + (hasHeader ? 32 : 0);
			end -= totalTagSize;
			if (end < start) end = start;
		}

		return buf.subarray(start, end);
	}

	/**
	 * Find the offset of the last APEv2 footer in `buf` within `[from, to)`.
	 * Searches backwards from `to` since the footer sits at the end of the
	 * audio data. Returns -1 if no footer is present.
	 */
	private static findApev2Footer(buf: Buffer, from: number, to: number): number {
		const needle = Buffer.from(PREAMBLE, 'ascii');
		// The footer is at least 32 bytes, and the preamble sits at its
		// start. Scan from the end of the region for the last occurrence.
		const limit = Math.max(from, to - 256); // footer is small; bound the scan
		for (let i = to - 32; i >= limit; i--) {
			if (buf.subarray(i, i + 8).equals(needle)) return i;
		}
		return -1;
	}

	/**
	 * Build a complete APEv2 tag (header → items → footer) from a flat
	 * record of text values. Item order matches insertion order. Both
	 * header and footer carry the same SIZE (= items + footer; header
	 * excluded) and COUNT.
	 */
	private static buildTag(tags: Record<string, string>): Buffer {
		const entries = Object.entries(tags);
		const itemBuffers = entries.map(([key, value]) => Apev2Writer.buildItem(key, value));

		// SIZE = all items + footer (32). The header is NOT counted (per
		// the APEv2 spec and music-metadata's TagFooter token).
		const itemsSize = itemBuffers.reduce((sum, b) => sum + b.length, 0);
		const size = itemsSize + 32;
		const count = entries.length;

		const header = Apev2Writer.buildFrame(FLAG_HEADER, size, count);
		const footer = Apev2Writer.buildFrame(FLAG_FOOTER, size, count);

		return Buffer.concat([header, ...itemBuffers, footer]);
	}

	/**
	 * Build the header or footer frame (preamble + version + size + count
	 * + flags + reserved). The only difference is the flags word.
	 */
	private static buildFrame(flags: number, size: number, count: number): Buffer {
		const buf = Buffer.alloc(32);
		buf.write(PREAMBLE, 0, 'ascii');
		buf.writeUInt32LE(VERSION, 8);
		buf.writeUInt32LE(size, 12);
		buf.writeUInt32LE(count, 16);
		buf.writeUInt32LE(flags, 20);
		RESERVED.copy(buf, 24);
		return buf;
	}

	/**
	 * Build a single APEv2 item: [size uint32][flags uint32][key\0][value].
	 * Text items use flags = 0.
	 */
	private static buildItem(key: string, value: string): Buffer {
		const valueBuf = Buffer.from(value, 'utf8');
		const keyBuf = Buffer.from(`${key}\0`, 'ascii');
		const header = Buffer.alloc(8);
		header.writeUInt32LE(valueBuf.length, 0);
		header.writeUInt32LE(FLAG_ITEM_TEXT, 4);
		return Buffer.concat([header, keyBuf, valueBuf]);
	}
}
