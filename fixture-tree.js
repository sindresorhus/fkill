import process from 'node:process';
import fs from 'node:fs';
import childProcess from 'node:child_process';

const readyFile = process.argv[2];
const mode = process.argv[3];

if (mode === 'child') {
	setInterval(() => {}, 1000);
} else {
	const child = childProcess.spawn(process.execPath, [process.argv[1], readyFile, 'child'], {
		stdio: 'ignore',
	});

	fs.writeFileSync(readyFile, JSON.stringify({childPid: child.pid}));
	setInterval(() => {}, 1000);
}
