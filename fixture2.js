const fkill = require('.');
const processExists = require('process-exists');

const originalFkillPid = process.pid;
(async () => {
	if (process.platform === 'win32') {
		await fkill('node.exe');
	} else {
		await fkill('node');
	}

	process.exitCode = await processExists(originalFkillPid) ? 0 : 10;
})();
