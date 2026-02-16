import { readFileSync } from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

export async function load() {
	const contentPath = path.join(process.cwd(), 'content.md');
	const markdown = readFileSync(contentPath, 'utf-8');
	const html = await marked.parse(markdown);
	return { html };
}
