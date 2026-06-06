import { DataGenerator } from '@fauxfetus/generator';
import path from 'path';

const CWD = process.cwd();

const READ_PATH = path.resolve(CWD, 'static/audio');
const WRITE_PATH = path.resolve(CWD, 'static/data');

let exitCode = 0;
try {
	const generator = await DataGenerator.create(READ_PATH, WRITE_PATH);
	await generator.run();
} catch (error) {
	// Validation errors are pre-formatted with their own report; this
	// prevents Node from dumping a stack trace on top of the report.
	console.error(error instanceof Error ? error.message : String(error));
	exitCode = 1;
}

process.exit(exitCode);
