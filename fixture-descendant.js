import process from 'node:process';
import childProcess from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const child = childProcess.spawn(process.execPath, ['-e', 'setInterval(() => {}, 10_000);'], {
	stdio: 'ignore',
});

const readyFile = path.join(os.tmpdir(), `fkill-tree-${process.pid}`);
fs.writeFileSync(readyFile, String(child.pid));

process.on('exit', () => {
	try {
		fs.unlinkSync(readyFile);
	} catch {}
});

setInterval(() => {}, 10_000);
