import { Ripper } from '@fauxfetus/ripper';
import path from 'path';

const CWD = process.cwd();

const config = {
	cdDevice: process.env.FF_CD_DEVICE ?? '/dev/sr0',
	audioDir: path.resolve(CWD, process.env.FF_AUDIO_DIR ?? 'static/audio')
};

const ripper = new Ripper(config);
const exitCode = await ripper.run();
process.exit(exitCode);
