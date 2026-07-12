import { Validator } from '@fauxfetus/data-validator';
import path from 'path';

const CWD = process.cwd();

const READ_PATH = path.resolve(CWD, 'static/audio');

const validator = new Validator(READ_PATH);
const summary = await validator.run();

validator.printReport(summary);
process.exit(summary.failures.length > 0 ? 1 : 0);
