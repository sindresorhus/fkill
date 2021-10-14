import process from 'node:process';
import taskkill from 'taskkill';
import execa from 'execa';
import AggregateError from 'aggregate-error';
import {portToPid} from 'pid-port';
import processExists from 'process-exists';
import psList from 'ps-list';

// If we check too soon, we're unlikely to see process killed so we essentially wait 3*ALIVE_CHECK_MIN_INTERVAL before the second check while producing unnecessary load.
// Primitive tests show that for a process which just dies on kill on a system without much load, we can usually see the process die in 5 ms.
// Checking once a second creates low enough load to not bother increasing maximum interval further, 1280 as first x to satisfy 2^^x * ALIVE_CHECK_MIN_INTERVAL > 1000.
const ALIVE_CHECK_MIN_INTERVAL = 5;
const ALIVE_CHECK_MAX_INTERVAL = 1280;

const TASKKILL_EXIT_CODE_FOR_PROCESS_FILTERING_SIGTERM = 255;

const delay = ms => new Promise(resolve => {
	setTimeout(resolve, ms);
});

const missingBinaryError = async (command, arguments_) => {
	try {
		return await execa(command, arguments_);
	} catch (error) {
		if (error.code === 'ENOENT') {
			const newError = new Error(`\`${command}\` doesn't seem to be installed and is required by fkill`);
			newError.sourceError = error;
			throw newError;
		}

		throw error;
	}
};

const windowsKill = async (input, options) => {
	try {
		return await taskkill(input, {
			force: options.force,
			tree: typeof options.tree === 'undefined' ? true : options.tree,
		});
	} catch (error) {
		if (error.exitCode === TASKKILL_EXIT_CODE_FOR_PROCESS_FILTERING_SIGTERM && !options.force) {
			return;
		}

		throw error;
	}
};

const macosKill = (input, options) => {
	const killByName = typeof input === 'string';
	const command = killByName ? 'pkill' : 'kill';
	const arguments_ = [input];

	if (options.force) {
		if (killByName) {
			arguments_.unshift('-KILL');
		} else {
			arguments_.unshift('-9');
		}
	}

	if (killByName && options.ignoreCase) {
		arguments_.unshift('-i');
	}

	return missingBinaryError(command, arguments_);
};

const defaultKill = (input, options) => {
	const killByName = typeof input === 'string';
	const command = killByName ? 'killall' : 'kill';
	const arguments_ = [input];

	if (options.force) {
		arguments_.unshift('-9');
	}

	if (killByName && options.ignoreCase) {
		arguments_.unshift('-I');
	}

	return missingBinaryError(command, arguments_);
};

const kill = (() => {
	if (process.platform === 'darwin') {
		return macosKill;
	}

	if (process.platform === 'win32') {
		return windowsKill;
	}

	return defaultKill;
})();

const parseInput = async input => {
	if (typeof input === 'string' && input[0] === ':') {
		return portToPid(Number.parseInt(input.slice(1), 10));
	}

	return input;
};

const killWithLimits = async (input, options) => {
	input = await parseInput(input);

	if (input === process.pid) {
		return;
	}

	if (input === 'node') {
		const processes = await psList();
		await Promise.all(processes.map(async ps => {
			if (ps.name === 'node' && ps.pid !== process.pid) {
				await kill(ps.pid, options);
			}
		}));
		return;
	}

	await kill(input, options);
};

export default async function fkill(inputs, options = {}) {
	inputs = [inputs].flat();

	const exists = await processExists.all(inputs);

	const errors = [];

	const handleKill = async input => {
		try {
			await killWithLimits(input, options);
		} catch (error) {
			if (!exists.get(input)) {
				errors.push(`Killing process ${input} failed: Process doesn't exist`);
				return;
			}

			errors.push(`Killing process ${input} failed: ${error.message.replace(/.*\n/, '').replace(/kill: \d+: /, '').trim()}`);
		}
	};

	await Promise.all(inputs.map(input => handleKill(input)));

	if (errors.length > 0 && !options.silent) {
		throw new AggregateError(errors);
	}

	if (options.forceAfterTimeout !== undefined && !options.force) {
		const endTime = Date.now() + options.forceAfterTimeout;
		let interval = ALIVE_CHECK_MIN_INTERVAL;
		if (interval > options.forceAfterTimeout) {
			interval = options.forceAfterTimeout;
		}

		let alive = inputs;

		do {
			await delay(interval); // eslint-disable-line no-await-in-loop

			alive = await processExists.filterExists(alive); // eslint-disable-line no-await-in-loop

			interval *= 2;
			if (interval > ALIVE_CHECK_MAX_INTERVAL) {
				interval = ALIVE_CHECK_MAX_INTERVAL;
			}
		} while (Date.now() < endTime && alive.length > 0);

		if (alive.length > 0) {
			await Promise.all(alive.map(async input => {
				try {
					await killWithLimits(input, {...options, force: true});
				} catch {
					// It's hard to filter does-not-exist kind of errors, so we ignore all of them here.
					// All meaningful errors should have been thrown before this operation takes place.
				}
			}));
		}
	}
}
