import process from 'node:process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Signal that handlers are set up
const readyFile = path.join(os.tmpdir(), `fkill-ready-${process.pid}`);
process.on('SIGTERM', () => {});
setInterval(() => {}, 10_000);

// Write ready marker after handlers are registered
fs.writeFileSync(readyFile, '');

// Clean up ready file on exit
process.on('exit', () => {
	try {
		fs.unlinkSync(readyFile);
	} catch {}
});
