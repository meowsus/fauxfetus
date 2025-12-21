import { DataGenerator } from '@fauxfetus/generator';
import path from 'path';

const CWD = process.cwd();

const READ_PATH = path.resolve(CWD, 'static/audio');
const WRITE_PATH = path.resolve(CWD, 'static/data');

const generator = new DataGenerator(READ_PATH, WRITE_PATH);
await generator.run();
