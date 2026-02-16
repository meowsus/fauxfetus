import { readFileSync } from 'node:fs';
import path from 'node:path';

export async function load() {
	const contentPath = path.join(process.cwd(), 'content.md');
	const markdown = readFileSync(contentPath, 'utf-8');
	return { markdown };
}
