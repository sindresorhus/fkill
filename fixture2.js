import process from 'node:process';
import processExists from 'process-exists';
import fkill from './index.js';

const originalFkillPid = process.pid;
(async () => {
	await (process.platform === 'win32' ? fkill('node.exe') : fkill('node'));

	process.exitCode = await processExists(originalFkillPid) ? 0 : 10;
})();
